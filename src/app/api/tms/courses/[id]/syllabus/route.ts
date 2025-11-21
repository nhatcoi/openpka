import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withIdAndBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { toBigIntUserId, serializeSyllabus, validateCourseId } from './utils';

// GET /api/tms/courses/[id]/syllabus
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.view');

    const courseId = validateCourseId(params.id);

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('version_id');
    const versionNo = searchParams.get('version_no');
    const isCurrent = searchParams.get('is_current') === 'true';

    // Build where clause
    const where: any = {};

    if (versionId) {
      // Verify version belongs to this course
      const courseVersion = await db.courseVersion.findUnique({
        where: { id: BigInt(versionId) },
        select: { id: true, course_id: true },
      });

      if (!courseVersion) {
        return { syllabus: [] };
      }

      if (courseVersion.course_id.toString() !== courseId.toString()) {
        return { syllabus: [] };
      }

      where.course_version_id = BigInt(versionId);
    } else {
      // Get all course versions if no specific version requested
      const courseVersions = await db.courseVersion.findMany({
        where: { course_id: BigInt(courseId) },
        select: { id: true },
      });

      const versionIds = courseVersions.map(v => v.id);
      if (versionIds.length > 0) {
        where.course_version_id = { in: versionIds };
      } else {
        // No versions exist, return empty
        return { syllabus: [] };
      }
    }

    if (versionNo) {
      where.version_no = parseInt(versionNo);
    }
    if (isCurrent) {
      where.is_current = true;
    }

    const syllabus = await db.courseSyllabus.findMany({
      where,
      orderBy: [
        { version_no: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return { syllabus: syllabus.map(serializeSyllabus) };
  },
  'fetch syllabus'
);

// POST /api/tms/courses/[id]/syllabus - Create or update syllabus (upsert)
export const POST = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const courseId = validateCourseId(id);

    const syllabusData = body as {
      course_version_id: string;
      status?: 'draft' | 'approved' | 'archived';
      language?: 'vi' | 'en' | 'vi-en';
      effective_from?: string;
      effective_to?: string;
      is_current?: boolean;
      basic_info?: any;
      learning_outcomes?: any;
      weekly_plan?: any;
      assessment_plan?: any;
      teaching_methods?: any;
      materials?: any;
      policies?: any;
      rubrics?: any;
    };

    if (!syllabusData.course_version_id) {
      throw new Error('course_version_id is required');
    }

    // Verify course version exists and belongs to this course
    const courseVersion = await db.courseVersion.findUnique({
      where: { id: BigInt(syllabusData.course_version_id) },
      select: { id: true, course_id: true },
    });

    if (!courseVersion) {
      throw new Error('Course version not found');
    }

    if (courseVersion.course_id.toString() !== courseId.toString()) {
      throw new Error('Course version does not belong to this course');
    }

    const result = await db.$transaction(async (tx) => {
      // Try to find existing syllabus (prefer is_current, otherwise latest)
      const existingSyllabus = await tx.courseSyllabus.findFirst({
        where: {
          course_version_id: BigInt(syllabusData.course_version_id),
        },
        orderBy: [
          { is_current: 'desc' },
          { version_no: 'desc' },
          { created_at: 'desc' },
        ],
      });

      const updatedBy = toBigIntUserId(session.user.id);

      if (existingSyllabus) {
        // Update existing syllabus
        if (syllabusData.is_current) {
          await tx.courseSyllabus.updateMany({
            where: {
              course_version_id: BigInt(syllabusData.course_version_id),
              id: { not: existingSyllabus.id },
            },
            data: {
              is_current: false,
            },
          });
        }

        const updateData: any = {
          ...(syllabusData.status !== undefined && { status: syllabusData.status }),
          ...(syllabusData.language !== undefined && { language: syllabusData.language }),
          ...(syllabusData.effective_from !== undefined && {
            effective_from: syllabusData.effective_from ? new Date(syllabusData.effective_from) : null,
          }),
          ...(syllabusData.effective_to !== undefined && {
            effective_to: syllabusData.effective_to ? new Date(syllabusData.effective_to) : null,
          }),
          ...(syllabusData.is_current !== undefined && { is_current: syllabusData.is_current }),
          ...(syllabusData.basic_info !== undefined && { basic_info: syllabusData.basic_info }),
          ...(syllabusData.learning_outcomes !== undefined && { learning_outcomes: syllabusData.learning_outcomes }),
          ...(syllabusData.weekly_plan !== undefined && { weekly_plan: syllabusData.weekly_plan }),
          ...(syllabusData.assessment_plan !== undefined && { assessment_plan: syllabusData.assessment_plan }),
          ...(syllabusData.teaching_methods !== undefined && { teaching_methods: syllabusData.teaching_methods }),
          ...(syllabusData.materials !== undefined && { materials: syllabusData.materials }),
          ...(syllabusData.policies !== undefined && { policies: syllabusData.policies }),
          ...(syllabusData.rubrics !== undefined && { rubrics: syllabusData.rubrics }),
          updated_by: updatedBy,
          updated_at: new Date(),
        };

        const updatedSyllabus = await tx.courseSyllabus.update({
          where: { id: existingSyllabus.id },
          data: updateData,
        });

        return serializeSyllabus(updatedSyllabus);
      } else {
        // Create new syllabus (first time)
        if (syllabusData.is_current) {
          await tx.courseSyllabus.updateMany({
            where: {
              course_version_id: BigInt(syllabusData.course_version_id),
            },
            data: {
              is_current: false,
            },
          });
        }

        const createdBy = toBigIntUserId(session.user.id);

        const newSyllabus = await tx.courseSyllabus.create({
          data: {
            course_version_id: BigInt(syllabusData.course_version_id),
            version_no: 1,
            status: syllabusData.status || 'draft',
            language: syllabusData.language || 'vi',
            effective_from: syllabusData.effective_from ? new Date(syllabusData.effective_from) : null,
            effective_to: syllabusData.effective_to ? new Date(syllabusData.effective_to) : null,
            is_current: syllabusData.is_current ?? false,
            basic_info: syllabusData.basic_info || null,
            learning_outcomes: syllabusData.learning_outcomes || null,
            weekly_plan: syllabusData.weekly_plan || null,
            assessment_plan: syllabusData.assessment_plan || null,
            teaching_methods: syllabusData.teaching_methods || null,
            materials: syllabusData.materials || null,
            policies: syllabusData.policies || null,
            rubrics: syllabusData.rubrics || null,
            created_by: createdBy,
            updated_by: updatedBy,
          },
        });

        return serializeSyllabus(newSyllabus);
      }
    });

    return createSuccessResponse({ syllabus: result });
  },
  'save syllabus'
);

// PUT /api/tms/courses/[id]/syllabus
export const PUT = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    const courseId = validateCourseId(id);

    const { syllabus_id, ...syllabusData } = body as {
      syllabus_id: string | number;
      version_no?: number;
      status?: 'draft' | 'approved' | 'archived';
      language?: 'vi' | 'en' | 'vi-en';
      effective_from?: string;
      effective_to?: string;
      is_current?: boolean;
      basic_info?: any;
      learning_outcomes?: any;
      weekly_plan?: any;
      assessment_plan?: any;
      teaching_methods?: any;
      materials?: any;
      policies?: any;
      rubrics?: any;
    };

    if (!syllabus_id) {
      throw new Error('Syllabus ID is required');
    }

    const result = await db.$transaction(async (tx) => {
      // Verify syllabus exists and belongs to this course
      const existingSyllabus = await tx.courseSyllabus.findUnique({
        where: { id: BigInt(syllabus_id) },
        include: {
          course_versions: {
            select: { course_id: true },
          },
        },
      });

      if (!existingSyllabus) {
        throw new Error('Syllabus not found');
      }

      if (existingSyllabus.course_versions.course_id.toString() !== courseId.toString()) {
        throw new Error('Syllabus does not belong to this course');
      }

      // If is_current is true, set all other versions to false
      if (syllabusData.is_current) {
        await tx.courseSyllabus.updateMany({
          where: {
            course_version_id: existingSyllabus.course_version_id,
            id: { not: BigInt(syllabus_id) },
          },
          data: {
            is_current: false,
          },
        });
      }

      // Build update data object
      const updateData: any = {
        ...(syllabusData.status !== undefined && { status: syllabusData.status }),
        ...(syllabusData.language !== undefined && { language: syllabusData.language }),
        ...(syllabusData.effective_from !== undefined && {
          effective_from: syllabusData.effective_from ? new Date(syllabusData.effective_from) : null,
        }),
        ...(syllabusData.effective_to !== undefined && {
          effective_to: syllabusData.effective_to ? new Date(syllabusData.effective_to) : null,
        }),
        ...(syllabusData.is_current !== undefined && { is_current: syllabusData.is_current }),
        ...(syllabusData.basic_info !== undefined && { basic_info: syllabusData.basic_info }),
        ...(syllabusData.learning_outcomes !== undefined && { learning_outcomes: syllabusData.learning_outcomes }),
        ...(syllabusData.weekly_plan !== undefined && { weekly_plan: syllabusData.weekly_plan }),
        ...(syllabusData.assessment_plan !== undefined && { assessment_plan: syllabusData.assessment_plan }),
        ...(syllabusData.teaching_methods !== undefined && { teaching_methods: syllabusData.teaching_methods }),
        ...(syllabusData.materials !== undefined && { materials: syllabusData.materials }),
        ...(syllabusData.policies !== undefined && { policies: syllabusData.policies }),
        ...(syllabusData.rubrics !== undefined && { rubrics: syllabusData.rubrics }),
        updated_by: toBigIntUserId(session.user.id),
        updated_at: new Date(),
      };

      const updatedSyllabus = await tx.courseSyllabus.update({
        where: { id: BigInt(syllabus_id) },
        data: updateData,
      });

      return serializeSyllabus(updatedSyllabus);
    });

    return createSuccessResponse({ syllabus: result });
  },
  'update syllabus'
);

// DELETE /api/tms/courses/[id]/syllabus
export const DELETE = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.delete');

    const courseId = validateCourseId(id);

    const { syllabus_id } = body as { syllabus_id: string | number };

    if (!syllabus_id) {
      throw new Error('Syllabus ID is required');
    }

    await db.$transaction(async (tx) => {
      // Verify syllabus exists and belongs to this course
      const existingSyllabus = await tx.courseSyllabus.findUnique({
        where: { id: BigInt(syllabus_id) },
        select: { course_version_id: true },
      });

      if (!existingSyllabus) {
        throw new Error('Syllabus not found');
      }

      // Verify course version belongs to this course
      const courseVersion = await tx.courseVersion.findUnique({
        where: { id: existingSyllabus.course_version_id },
        select: { course_id: true },
      });

      if (!courseVersion || courseVersion.course_id.toString() !== courseId.toString()) {
        throw new Error('Syllabus does not belong to this course');
      }

      await tx.courseSyllabus.delete({
        where: { id: BigInt(syllabus_id) },
      });
    });

    return createSuccessResponse({ message: 'Syllabus deleted successfully' });
  },
  'delete syllabus'
);
