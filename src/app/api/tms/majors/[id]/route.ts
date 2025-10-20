import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandling, withIdParam, withIdAndBody, validateSchema, createErrorResponse } from '@/lib/api/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { MajorStatus, MAJOR_PERMISSIONS } from '@/constants/majors';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

// Simplified update schema without removed JSON fields
const updateMajorSchema = z.object({
  code: z.string().min(1).max(32).optional(),
  name_vi: z.string().min(1).max(255).optional(),
  name_en: z.string().max(255).optional(),
  short_name: z.string().max(100).optional(),
  slug: z.string().max(255).optional(),
  national_code: z.string().max(32).optional(),
  is_moet_standard: z.boolean().optional(),
  degree_level: z.string().max(32).optional(),
  field_cluster: z.string().max(64).optional(),
  specialization_model: z.string().max(32).optional(),
  org_unit_id: z.number().optional(),
  parent_major_id: z.number().nullable().optional(),
  duration_years: z.number().min(0.1).max(10).optional(),
  total_credits_min: z.number().min(1).max(1000).optional(),
  total_credits_max: z.number().min(1).max(1000).optional(),
  semesters_per_year: z.number().min(1).max(4).optional(),
  start_terms: z.string().max(64).optional(),
  default_quota: z.number().min(0).optional(),
  tuition_group: z.string().max(64).optional(),
  status: z.enum(['DRAFT', 'PROPOSED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional(),
  workflow_notes: z.string().optional(), // This will be mapped to notes field
  established_at: z.string().optional(),
  closed_at: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/tms/majors/[id]
export const GET = withIdParam(async (id: string) => {
  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  const major = await prisma.major.findUnique({
    where: { id: majorId },
    include: {
      OrgUnit: { select: { id: true, name: true, code: true, type: true } },
      Major: { select: { id: true, code: true, name_vi: true, name_en: true } },
      other_majors: { select: { id: true, code: true, name_vi: true, name_en: true } },
      Program: {
        select: {
          id: true, code: true, name_vi: true, name_en: true,
          version: true, status: true, total_credits: true,
          effective_from: true, effective_to: true
        }
      },
      MajorOutcome: { select: { id: true, code: true, content: true, version: true, is_active: true } },
      MajorQuotaYear: { select: { id: true, year: true, quota: true, note: true } },
      MajorTuition: { select: { id: true, year: true, tuition_group: true, amount_vnd: true, note: true } },
    }
  });

  if (!major) {
    throw new Error('Major not found');
  }

  return { data: major };
}, 'fetch major');

// PUT /api/tms/majors/[id]
export const PUT = withIdAndBody(async (id: string, body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  const validatedData = validateSchema(updateMajorSchema, body);
  const numericUserId = Number(session.user.id);
  const actorId = Number.isNaN(numericUserId) ? BigInt(1) : BigInt(numericUserId);

  // Check if major exists
  const existingMajor = await prisma.major.findUnique({
    where: { id: majorId }
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

  const result = await prisma.$transaction(async (tx) => {
    const majorBigInt = BigInt(majorId);

    // Update major
    const { workflow_notes, ...updateData } = validatedData;
    const updatedMajor = await tx.major.update({
      where: { id: majorBigInt },
      data: {
        ...updateData,
        notes: workflow_notes || updateData.notes, // Map workflow_notes to notes field
        parent_major_id: validatedData.parent_major_id || null,
        established_at: validatedData.established_at ? new Date(validatedData.established_at) : null,
        closed_at: validatedData.closed_at ? new Date(validatedData.closed_at) : null,
        updated_at: new Date(),
        updated_by: actorId,
      },
      include: {
        OrgUnit: { select: { id: true, name: true, code: true } }
      }
    });

    // If status was directly provided, persist an approval history entry
    const directStatus = (validatedData as any).status as MajorStatus | undefined;
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
          comments: (validatedData as any).workflow_notes || null,
          approved_at: new Date(),
        },
      });
    }

    return updatedMajor;
  });

  return { data: result, message: 'Major updated successfully' };
}, 'update major');

// DELETE /api/tms/majors/[id]
export const DELETE = withIdParam(async (id: string) => {
  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  // Check if major exists
  const existingMajor = await prisma.major.findUnique({
    where: { id: majorId }
  });

  if (!existingMajor) {
    throw new Error('Major not found');
  }

  // Check if major has related data
  const relatedData = await prisma.major.findUnique({
    where: { id: majorId },
    include: {
      _count: {
        select: {
          Program: true,
          MajorOutcome: true,
          MajorQuotaYear: true,
          MajorTuition: true,
          other_majors: true
        }
      }
    }
  });

  if (relatedData && (
    relatedData._count.Program > 0 ||
    relatedData._count.MajorOutcome > 0 ||
    relatedData._count.MajorQuotaYear > 0 ||
    relatedData._count.MajorTuition > 0 ||
    relatedData._count.other_majors > 0
  )) {
    throw new Error('Cannot delete major with related data');
  }

  // Delete major
  await prisma.major.delete({
    where: { id: majorId }
  });

  return { message: 'Major deleted successfully' };
}, 'delete major');