import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandling, withIdParam, withIdAndBody, validateSchema, createErrorResponse } from '@/lib/api/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { MajorStatus, MAJOR_PERMISSIONS } from '@/constants/majors';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

// Simplified update schema aligned with current DB columns
const updateMajorSchema = z.object({
  code: z.string().min(1).max(32).optional(),
  name_vi: z.string().min(1).max(255).optional(),
  name_en: z.string().max(255).optional(),
  short_name: z.string().max(100).optional(),
  slug: z.string().max(255).optional(),
  degree_level: z.string().max(32).optional(),
  org_unit_id: z.number().optional(),
  duration_years: z.number().min(0.1).max(10).optional(),
  total_credits_min: z.number().min(1).max(1000).optional(),
  total_credits_max: z.number().min(1).max(1000).optional(),
  semesters_per_year: z.number().min(1).max(4).optional(),
  status: z.enum(['DRAFT', 'PROPOSED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional(),
  closed_at: z.string().optional(),
  workflow_notes: z.string().optional(),
});

// GET /api/tms/majors/[id]
export const GET = withIdParam(async (id: string) => {
  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  const major = await prisma.major.findUnique({
    where: { id: majorId },
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      short_name: true,
      slug: true,
      degree_level: true,
      org_unit_id: true,
      duration_years: true,
      total_credits_min: true,
      total_credits_max: true,
      semesters_per_year: true,
      status: true,
      closed_at: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true,
    }
  });

  if (!major) {
    throw new Error('Major not found');
  }

  return { data: major };
}, 'fetch major');

// PUT /api/tms/majors/[id]
export const PUT = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }
  
  // Check permission
  requirePermission(session, MAJOR_PERMISSIONS.UPDATE);

  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  const validatedData = validateSchema(updateMajorSchema, body);
  const numericUserId = Number(session.user.id);
  const actorId = Number.isNaN(numericUserId) ? BigInt(1) : BigInt(numericUserId);
  const majorBigInt = BigInt(majorId);

  // Check if major exists
  const existingMajor = await prisma.major.findUnique({
    where: { id: majorId },
    select: {
      id: true,
      status: true,
    }
  });

  if (!existingMajor) {
    throw new Error('Major not found');
  }

  // Check for duplicate code if code is being updated
  if (validatedData.code && validatedData.org_unit_id) {
    const duplicateMajor = await prisma.major.findFirst({
      where: {
        org_unit_id: validatedData.org_unit_id,
        code: validatedData.code,
        id: { not: majorId }
      }
    });

    if (duplicateMajor) {
      throw new Error('Major code already exists for this organization unit');
    }
  }

  // Get request context and actor info for history tracking
  const { getRequestContext, getActorInfo, setHistoryContext } = await import('@/lib/db-history-context');
  const requestContext = getRequestContext(request as any);
  const actorInfo = await getActorInfo(session.user.id, prisma);

  // Use transaction to update major and create approval history
  const result = await prisma.$transaction(async (tx) => {
    // IMPORTANT: Set history context FIRST before any other queries
    // This ensures session variables are available when triggers fire
    await setHistoryContext(tx, {
      ...(actorInfo.actorId !== null && { actorId: actorInfo.actorId }),
      ...(actorInfo.actorName !== null && { actorName: actorInfo.actorName }),
      ...(requestContext.userAgent && { userAgent: requestContext.userAgent }),
      metadata: {
        major_id: majorId,
        status: validatedData.status,
      },
    });

    // Prepare update data
    const updateData: any = {
      updated_at: new Date(),
      updated_by: actorId,
    };

    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.name_vi !== undefined) updateData.name_vi = validatedData.name_vi;
    if (validatedData.name_en !== undefined) updateData.name_en = validatedData.name_en;
    if (validatedData.short_name !== undefined) updateData.short_name = validatedData.short_name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.degree_level !== undefined) updateData.degree_level = validatedData.degree_level;
    if (validatedData.org_unit_id !== undefined) updateData.org_unit_id = BigInt(validatedData.org_unit_id);
    if (validatedData.duration_years !== undefined) updateData.duration_years = validatedData.duration_years;
    if (validatedData.total_credits_min !== undefined) updateData.total_credits_min = validatedData.total_credits_min;
    if (validatedData.total_credits_max !== undefined) updateData.total_credits_max = validatedData.total_credits_max;
    if (validatedData.semesters_per_year !== undefined) updateData.semesters_per_year = validatedData.semesters_per_year;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.closed_at !== undefined) {
      updateData.closed_at = validatedData.closed_at ? new Date(validatedData.closed_at) : null;
    }

    const updated = await tx.major.update({
      where: { id: majorId },
      data: updateData,
      select: {
        id: true,
        code: true,
        name_vi: true,
        name_en: true,
        short_name: true,
        slug: true,
        degree_level: true,
        org_unit_id: true,
        duration_years: true,
        total_credits_min: true,
        total_credits_max: true,
        semesters_per_year: true,
        status: true,
        closed_at: true,
        created_by: true,
        updated_by: true,
        created_at: true,
        updated_at: true,
      }
    });

    // If status was directly provided, persist an approval history entry
    const directStatus = (body as any).status as MajorStatus | undefined;
    if (directStatus) {
      // Ensure workflow instance exists
      let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('MAJOR', majorBigInt);
      if (!workflowInstance) {
        workflowInstance = await academicWorkflowEngine.createWorkflow({
          entityType: 'MAJOR',
          entityId: majorBigInt,
          initiatedBy: actorId,
          metadata: { major_id: majorId },
        }) as any;
      }

      const mapStatusToAction = (s: MajorStatus): string => {
        switch (s) {
          case MajorStatus.REVIEWING:
            return 'REVIEW';
          case MajorStatus.APPROVED:
            return 'APPROVE';
          case MajorStatus.REJECTED:
            return 'REJECT';
          case MajorStatus.PUBLISHED:
            return 'PUBLISH';
          case MajorStatus.DRAFT:
          default:
            return 'RETURN';
        }
      };

      await tx.approvalRecord.create({
        data: {
          workflow_instance_id: BigInt((workflowInstance as any).id),
          approver_id: actorId,
          action: mapStatusToAction(directStatus),
          comments: (body as any).workflow_notes || null,
          approved_at: new Date(),
        },
      });
    }

    return updated;
  });

  return { data: result, message: 'Major updated successfully' };
}, 'update major');

// DELETE /api/tms/majors/[id]
export const DELETE = withIdParam(async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  // Check permission
  requirePermission(session, MAJOR_PERMISSIONS.DELETE);
  
  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  // Check if major exists
  const existingMajor = await prisma.major.findUnique({
    where: { id: majorId },
    select: {
      id: true,
    }
  });

  if (!existingMajor) {
    throw new Error('Major not found');
  }

  // Delete major
  await prisma.major.delete({
    where: { id: majorId }
  });

  return { message: 'Major deleted successfully' };
}, 'delete major');