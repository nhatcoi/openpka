import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withIdAndBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';

// GET /api/tms/courses/[id]/syllabus
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.view');

    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      throw new Error('Invalid course ID');
    }

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('version_id');

    const course = await db.course.findUnique({
      where: { id: BigInt(courseId) },
      select: {
        id: true,
        code: true,
        name_vi: true,
          CourseVersion: {
            where: versionId ? { id: BigInt(versionId) } : undefined,
            include: {
              CourseSyllabus: {
                select: {
                  id: true,
                  syllabus_data: true,
                  created_by: true,
                  created_at: true,
                },
              },
            },
            orderBy: { created_at: 'desc' },
          },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return createSuccessResponse(course);
  },
  'fetch syllabus'
);

// PUT /api/tms/courses/[id]/syllabus
export const PUT = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      throw new Error('Invalid course ID');
    }

    const { version_id, syllabus } = body as {
      version_id: string;
      syllabus: Array<{
        week_number: number;
        topic: string;
        teaching_methods?: string;
        materials?: string;
        assignments?: string;
        duration_hours?: number;
        is_exam_week?: boolean;
      }>;
    };

    if (!version_id) {
      throw new Error('Version ID is required');
    }

    const result = await db.$transaction(async (tx) => {
      // Verify course version exists
      const courseVersion = await tx.courseVersion.findUnique({
        where: { id: BigInt(version_id) },
        select: { id: true, course_id: true },
      });

      if (!courseVersion) {
        throw new Error('Course version not found');
      }

      if (courseVersion.course_id.toString() !== courseId.toString()) {
        throw new Error('Version does not belong to this course');
      }

      // Delete existing syllabus for this version
      await tx.courseSyllabus.deleteMany({
        where: { course_version_id: courseVersion.id },
      });

      // Create new syllabus entry with all weeks in JSONB format
      if (syllabus && Array.isArray(syllabus) && syllabus.length > 0) {
        const syllabusWeeks = syllabus
          .map((week) => ({
            week_number: week.week_number,
            topic: week.topic || '',
            teaching_methods: week.teaching_methods || null,
            materials: week.materials || null,
            assignments: week.assignments || null,
            duration_hours: String(week.duration_hours || 3),
            is_exam_week: week.is_exam_week || false,
          }))
          .filter((week) => week.week_number > 0)
          .sort((a, b) => a.week_number - b.week_number);

        if (syllabusWeeks.length > 0) {
          await tx.courseSyllabus.create({
            data: {
              course_version_id: courseVersion.id,
              syllabus_data: syllabusWeeks,
              created_by: BigInt(session.user.id),
              created_at: new Date(),
            },
          });
        }
      }

      // Fetch updated syllabus
      const updatedSyllabus = await tx.courseSyllabus.findFirst({
        where: { course_version_id: courseVersion.id },
        select: {
          id: true,
          syllabus_data: true,
          created_by: true,
          created_at: true,
        },
      });

      // Convert BigInt to string for JSON serialization
      return updatedSyllabus ? {
        id: updatedSyllabus.id.toString(),
        syllabus_data: updatedSyllabus.syllabus_data,
        created_by: updatedSyllabus.created_by.toString(),
        created_at: updatedSyllabus.created_at,
      } : null;
    });

    return createSuccessResponse({ syllabus: result });
  },
  'update syllabus'
);

