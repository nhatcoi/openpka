import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withIdParam, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { CoursePrerequisiteType } from '@/constants/courses';
import { z } from 'zod';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';

const updatePrerequisiteSchema = z.object({
  prerequisite_type: z.enum(['prerequisite', 'prior', 'corequisite']).optional(),
  description: z.string().optional().nullable(),
});

// PUT /api/tms/courses/[id]/prerequisites/[prereqId]
export const PUT = withErrorHandling(
  async (
    request: NextRequest,
    ctx?: {
      params?: Promise<{ id: string; prereqId: string }>;
    }
  ) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    if (!ctx?.params) throw new Error('Thiếu tham số');
    const { id, prereqId } = await ctx.params;

    const courseId = parseInt(id);
    const prerequisiteId = parseInt(prereqId);

    if (isNaN(courseId) || isNaN(prerequisiteId)) {
      throw new Error('ID học phần hoặc ID điều kiện không hợp lệ');
    }

    const body = await request.json();
    const validatedData = updatePrerequisiteSchema.parse(body);

    // Check if prerequisite exists and belongs to this course
    const existing = await db.coursePrerequisites.findUnique({
      where: { id: BigInt(prerequisiteId) },
      select: { course_id: true },
    });

    if (!existing) {
      throw new Error('Không tìm thấy điều kiện học phần');
    }

    if (existing.course_id?.toString() !== courseId.toString()) {
      throw new Error('Điều kiện không thuộc về học phần này');
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
          prerequisite_id: prerequisiteId,
        },
      });

      const updateData: any = {};
      if (validatedData.prerequisite_type !== undefined) {
        updateData.prerequisite_type = validatedData.prerequisite_type as CoursePrerequisiteType;
      }
      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description || null;
      }

      const updated = await tx.coursePrerequisites.update({
        where: { id: BigInt(prerequisiteId) },
        data: updateData,
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
        id: updated.id.toString(),
        course_id: updated.course_id?.toString(),
        prerequisite_course_id: updated.prerequisite_course_id?.toString(),
        prerequisite_type: updated.prerequisite_type,
        description: updated.description,
        created_at: updated.created_at?.toISOString(),
        prerequisite_course: updated.prerequisite_course
          ? {
              id: updated.prerequisite_course.id.toString(),
              code: updated.prerequisite_course.code,
              name_vi: updated.prerequisite_course.name_vi,
              name_en: updated.prerequisite_course.name_en,
              credits: parseFloat(updated.prerequisite_course.credits.toString()),
            }
          : null,
      };
    });

    return result;
  },
  'update prerequisite'
);

// DELETE /api/tms/courses/[id]/prerequisites/[prereqId]
export const DELETE = withErrorHandling(
  async (
    request: NextRequest,
    ctx?: {
      params?: Promise<{ id: string; prereqId: string }>;
    }
  ) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    requirePermission(session, 'tms.course.update');

    if (!ctx?.params) throw new Error('Thiếu tham số');
    const { id, prereqId } = await ctx.params;

    const courseId = parseInt(id);
    const prerequisiteId = parseInt(prereqId);

    if (isNaN(courseId) || isNaN(prerequisiteId)) {
      throw new Error('ID học phần hoặc ID điều kiện không hợp lệ');
    }

    // Check if prerequisite exists and belongs to this course
    const existing = await db.coursePrerequisites.findUnique({
      where: { id: BigInt(prerequisiteId) },
      select: { course_id: true },
    });

    if (!existing) {
      throw new Error('Không tìm thấy điều kiện học phần');
    }

    if (existing.course_id?.toString() !== courseId.toString()) {
      throw new Error('Điều kiện không thuộc về học phần này');
    }

    // Get request context and actor info for history tracking
    const requestContext = getRequestContext(request);
    const actorInfo = await getActorInfo(session.user.id, db);

    await db.$transaction(async (tx) => {
      // IMPORTANT: Set history context FIRST before any other queries
      await setHistoryContext(tx, {
        ...(actorInfo.actorId !== null && { actorId: actorInfo.actorId }),
        ...(actorInfo.actorName !== null && { actorName: actorInfo.actorName }),
        ...(requestContext.userAgent && { userAgent: requestContext.userAgent }),
        metadata: {
          course_id: courseId,
          prerequisite_id: prerequisiteId,
        },
      });

      await tx.coursePrerequisites.delete({
        where: { id: BigInt(prerequisiteId) },
      });
    });

    return { success: true };
  },
  'delete prerequisite'
);

