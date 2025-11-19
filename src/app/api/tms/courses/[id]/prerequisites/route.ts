import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withIdAndBody, createErrorResponse, createSuccessResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { CoursePrerequisiteType } from '@/constants/courses';
import { z } from 'zod';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';

// GET /api/tms/courses/[id]/prerequisites
export const GET = withErrorHandling(async (request: NextRequest, ctx?: { params?: Promise<{ id: string }> }) => {
  if (!ctx?.params) throw new Error('Thiếu tham số');
  const { id } = await ctx.params;
  
  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('ID học phần không hợp lệ');
  }

  const prerequisites = await db.coursePrerequisites.findMany({
    where: { course_id: BigInt(courseId) },
    include: {
      prerequisite_course: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          name_en: true,
          credits: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  // Serialize BigInt values
  const serialized = prerequisites.map((p) => ({
    id: p.id.toString(),
    course_id: p.course_id?.toString(),
    prerequisite_course_id: p.prerequisite_course_id?.toString(),
    prerequisite_type: p.prerequisite_type,
    description: p.description,
    created_at: p.created_at?.toISOString(),
    prerequisite_course: p.prerequisite_course
      ? {
          id: p.prerequisite_course.id.toString(),
          code: p.prerequisite_course.code,
          name_vi: p.prerequisite_course.name_vi,
          name_en: p.prerequisite_course.name_en,
          credits: parseFloat(p.prerequisite_course.credits.toString()),
        }
      : null,
  }));

  return serialized;
}, 'fetch prerequisites');

const createPrerequisiteSchema = z.object({
  prerequisite_course_id: z.string().or(z.number()),
  prerequisite_type: z.enum(['prerequisite', 'prior', 'corequisite']),
  description: z.string().optional().nullable(),
});

// POST /api/tms/courses/[id]/prerequisites
export const POST = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  requirePermission(session, 'tms.course.update');

  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('ID học phần không hợp lệ');
  }

  const validatedData = createPrerequisiteSchema.parse(body);

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: BigInt(courseId) },
    select: { id: true, code: true, name_vi: true },
  });

  if (!course) {
    throw new Error('Không tìm thấy học phần');
  }

  // Check if prerequisite course exists
  const prerequisiteCourseId = BigInt(
    typeof validatedData.prerequisite_course_id === 'string'
      ? validatedData.prerequisite_course_id
      : validatedData.prerequisite_course_id
  );

  const prerequisiteCourse = await db.course.findUnique({
    where: { id: prerequisiteCourseId },
    select: { id: true, code: true, name_vi: true },
  });

  if (!prerequisiteCourse) {
    throw new Error('Không tìm thấy học phần điều kiện');
  }

  // Prevent self-reference
  if (courseId === Number(prerequisiteCourseId)) {
    throw new Error('Học phần không thể là điều kiện của chính nó');
  }

  // Get request context and actor info for history tracking
  const requestContext = getRequestContext(request);
  const actorInfo = await getActorInfo(session.user.id, db);

  const result = await db.$transaction(async (tx) => {
    // IMPORTANT: Set history context FIRST before any other queries
    await setHistoryContext(tx, {
      ...(actorInfo.actorId !== null && { actorId: actorInfo.actorId }),
      ...(actorInfo.actorName !== null && { actorName: actorInfo.actorName }),
      ...(requestContext.userAgent && { userAgent: requestContext.userAgent }),
      metadata: {
        course_id: courseId,
        prerequisite_course_id: prerequisiteCourseId.toString(),
        prerequisite_type: validatedData.prerequisite_type,
      },
    });

    // Check if prerequisite already exists
    const existing = await tx.coursePrerequisites.findUnique({
      where: {
        course_id_prerequisite_course_id: {
          course_id: BigInt(courseId),
          prerequisite_course_id: prerequisiteCourseId,
        },
      },
    });

    if (existing) {
      throw new Error(`Học phần "${prerequisiteCourse.code} - ${prerequisiteCourse.name_vi}" đã được thêm vào điều kiện của học phần "${course.code} - ${course.name_vi}"`);
    }

    const prerequisite = await tx.coursePrerequisites.create({
      data: {
        course_id: BigInt(courseId),
        prerequisite_course_id: prerequisiteCourseId,
        prerequisite_type: validatedData.prerequisite_type as CoursePrerequisiteType,
        description: validatedData.description || null,
        created_at: new Date(),
      },
      include: {
        prerequisite_course: {
          select: {
            id: true,
            code: true,
            name_vi: true,
            name_en: true,
            credits: true,
          },
        },
      },
    });

    return {
      id: prerequisite.id.toString(),
      course_id: prerequisite.course_id?.toString(),
      prerequisite_course_id: prerequisite.prerequisite_course_id?.toString(),
      prerequisite_type: prerequisite.prerequisite_type,
      description: prerequisite.description,
      created_at: prerequisite.created_at?.toISOString(),
      prerequisite_course: prerequisite.prerequisite_course
        ? {
            id: prerequisite.prerequisite_course.id.toString(),
            code: prerequisite.prerequisite_course.code,
            name_vi: prerequisite.prerequisite_course.name_vi,
            name_en: prerequisite.prerequisite_course.name_en,
            credits: parseFloat(prerequisite.prerequisite_course.credits.toString()),
          }
        : null,
    };
  });

  return result;
}, 'create prerequisite');

