import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withIdAndBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { toBigIntUserId, serializeSyllabus, validateCourseId } from '../utils';

// POST /api/tms/courses/[id]/syllabus/create-version - Create a new version from existing syllabus
export const POST = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const courseId = validateCourseId(id);

    const { syllabus_id, course_version_id } = body as {
      syllabus_id: string | number;
      course_version_id: string;
    };

    if (!syllabus_id || !course_version_id) {
      throw new Error('syllabus_id and course_version_id are required');
    }

    // Verify course version exists and belongs to this course
    const courseVersion = await db.courseVersion.findUnique({
      where: { id: BigInt(course_version_id) },
      select: { id: true, course_id: true },
    });

    if (!courseVersion) {
      throw new Error('Course version not found');
    }

    if (courseVersion.course_id.toString() !== courseId.toString()) {
      throw new Error('Course version does not belong to this course');
    }

    const result = await db.$transaction(async (tx) => {
      // Get source syllabus
      const sourceSyllabus = await tx.courseSyllabus.findUnique({
        where: { id: BigInt(syllabus_id) },
      });

      if (!sourceSyllabus) {
        throw new Error('Source syllabus not found');
      }

      if (sourceSyllabus.course_version_id.toString() !== course_version_id) {
        throw new Error('Syllabus does not belong to this course version');
      }

      // Get next version number
      const lastVersion = await tx.courseSyllabus.findFirst({
        where: {
          course_version_id: BigInt(course_version_id),
        },
        orderBy: { version_no: 'desc' },
        select: { version_no: true },
      });
      const nextVersionNo = lastVersion ? lastVersion.version_no + 1 : 1;

      const createdBy = toBigIntUserId(session.user.id);
      const updatedBy = toBigIntUserId(session.user.id);

      // Create new version by copying from source
      const newSyllabus = await tx.courseSyllabus.create({
        data: {
          course_version_id: BigInt(course_version_id),
          version_no: nextVersionNo,
          status: 'draft', // New version always starts as draft
          language: sourceSyllabus.language,
          effective_from: null, // Reset effective dates for new version
          effective_to: null,
          is_current: false, // New version is not current by default
          basic_info: sourceSyllabus.basic_info,
          learning_outcomes: sourceSyllabus.learning_outcomes,
          weekly_plan: sourceSyllabus.weekly_plan,
          assessment_plan: sourceSyllabus.assessment_plan,
          teaching_methods: sourceSyllabus.teaching_methods,
          materials: sourceSyllabus.materials,
          policies: sourceSyllabus.policies,
          rubrics: sourceSyllabus.rubrics,
          created_by: createdBy,
          updated_by: updatedBy,
        },
      });

      return serializeSyllabus(newSyllabus);
    });

    return createSuccessResponse({ syllabus: result });
  },
  'create syllabus version'
);

