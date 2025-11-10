import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandling, withIdParam, withIdAndBody, validateSchema, createErrorResponse } from '@/lib/api/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { MajorStatus, MAJOR_PERMISSIONS } from '@/constants/majors';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

// Simplified update schema aligned with current DB columns
const updateMajorSchema = z.object({
  code: z.string().min(1).max(32).optional(),
  name_vi: z.string().min(1).max(255).optional(),
  name_en: z.string().max(255).optional(),
  short_name: z.string().max(100).optional(),
  slug: z.string().max(255).optional(),
  is_moet_standard: z.boolean().optional(),
  degree_level: z.string().max(32).optional(),
  field_cluster: z.string().max(64).optional(),
  org_unit_id: z.number().optional(),
  duration_years: z.number().min(0.1).max(10).optional(),
  total_credits_min: z.number().min(1).max(1000).optional(),
  total_credits_max: z.number().min(1).max(1000).optional(),
  semesters_per_year: z.number().min(1).max(4).optional(),
  start_terms: z.string().max(64).optional(),
  status: z.enum(['DRAFT', 'PROPOSED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional(),
  established_at: z.string().optional(),
  closed_at: z.string().optional(),
  description: z.string().optional(),
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
      is_moet_standard: true,
      degree_level: true,
      field_cluster: true,
      org_unit_id: true,
      duration_years: true,
      total_credits_min: true,
      total_credits_max: true,
      semesters_per_year: true,
      start_terms: true,
      status: true,
      established_at: true,
      closed_at: true,
      description: true,
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

  const updated = await prisma.major.update({
    where: { id: majorId },
    data: {
      ...validatedData,
      established_at: validatedData.established_at ? new Date(validatedData.established_at) : null,
      closed_at: validatedData.closed_at ? new Date(validatedData.closed_at) : null,
      updated_at: new Date(),
      updated_by: actorId,
    },
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      short_name: true,
      slug: true,
      is_moet_standard: true,
      degree_level: true,
      field_cluster: true,
      org_unit_id: true,
      duration_years: true,
      total_credits_min: true,
      total_credits_max: true,
      semesters_per_year: true,
      start_terms: true,
      status: true,
      established_at: true,
      closed_at: true,
      description: true,
      created_by: true,
      updated_by: true,
      created_at: true,
      updated_at: true,
    }
  });

  return { data: updated, message: 'Major updated successfully' };
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

  // Delete major
  await prisma.major.delete({
    where: { id: majorId }
  });

  return { message: 'Major deleted successfully' };
}, 'delete major');