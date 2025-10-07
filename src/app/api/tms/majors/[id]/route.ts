import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandling, withIdParam, withIdAndBody, validateSchema } from '@/lib/api/api-handler';

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
  parent_major_id: z.number().optional(),
  duration_years: z.number().min(0.1).max(10).optional(),
  total_credits_min: z.number().min(1).max(1000).optional(),
  total_credits_max: z.number().min(1).max(1000).optional(),
  semesters_per_year: z.number().min(1).max(4).optional(),
  start_terms: z.string().max(64).optional(),
  default_quota: z.number().min(0).optional(),
  tuition_group: z.string().max(64).optional(),
  status: z.enum(['draft', 'proposed', 'active', 'suspended', 'closed']).optional(),
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
  const majorId = parseInt(id);

  if (isNaN(majorId)) {
    throw new Error('Invalid major ID');
  }

  const validatedData = validateSchema(updateMajorSchema, body);

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

  // Update major
  const updatedMajor = await prisma.major.update({
    where: { id: majorId },
    data: {
      ...validatedData,
      updated_at: new Date(),
    },
    include: {
      OrgUnit: { select: { id: true, name: true, code: true } }
    }
  });

  return { data: updatedMajor, message: 'Major updated successfully' };
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