import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandling, withBody, createSuccessResponse, createErrorResponse, validateSchema } from '@/lib/api/api-handler';

// Simplified schema without removed JSON fields
const createMajorSchema = z.object({
  code: z.string().min(1).max(32),
  name_vi: z.string().min(1).max(255),
  name_en: z.string().max(255).optional(),
  short_name: z.string().max(100).optional(),
  slug: z.string().max(255).optional(),
  national_code: z.string().max(32).optional(),
  is_moet_standard: z.boolean().optional(),
  degree_level: z.string().min(1).max(32),
  field_cluster: z.string().max(64).optional(),
  specialization_model: z.string().max(32).optional(),
  org_unit_id: z.number(),
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

// GET /api/tms/majors
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const degree_level = searchParams.get('degree_level') || '';
  const org_unit_id = searchParams.get('org_unit_id') || '';

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name_vi: { contains: search, mode: 'insensitive' } },
      { name_en: { contains: search, mode: 'insensitive' } },
      { short_name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { national_code: { contains: search, mode: 'insensitive' } },
      { field_cluster: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (degree_level) where.degree_level = degree_level;
  if (org_unit_id) where.org_unit_id = parseInt(org_unit_id);

  // Get majors with full related data
  const [majors, total] = await Promise.all([
    prisma.major.findMany({
      where,
      include: {
        OrgUnit: { 
          select: { 
            id: true, 
            name: true, 
            code: true, 
            type: true,
            parent_id: true 
          } 
        },
        Major: { 
          select: { 
            id: true, 
            code: true, 
            name_vi: true, 
            name_en: true,
            degree_level: true 
          } 
        },
        other_majors: { 
          select: { 
            id: true, 
            code: true, 
            name_vi: true, 
            name_en: true,
            degree_level: true 
          } 
        },
        Program: {
          select: {
            id: true,
            code: true,
            name_vi: true,
            name_en: true,
            version: true,
            status: true,
            total_credits: true,
            effective_from: true,
            effective_to: true
          },
          orderBy: { id: 'desc' },
          take: 3
        },
        MajorOutcome: {
          select: {
            id: true,
            code: true,
            content: true,
            version: true,
            is_active: true
          },
          orderBy: { id: 'desc' },
          take: 5
        },
        MajorQuotaYear: {
          select: {
            id: true,
            year: true,
            quota: true,
            note: true
          },
          orderBy: { year: 'desc' },
          take: 3
        },
        MajorTuition: {
          select: {
            id: true,
            year: true,
            tuition_group: true,
            amount_vnd: true,
            note: true
          },
          orderBy: { year: 'desc' },
          take: 3
        },
        _count: { 
          select: { 
            Program: true, 
            MajorOutcome: true, 
            MajorQuotaYear: true, 
            MajorTuition: true,
            other_majors: true
          } 
        },
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    }),
    prisma.major.count({ where })
  ]);

  return {
    data: majors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  };
}, 'fetch majors');

// POST /api/tms/majors
export const POST = withBody(async (body: unknown) => {
  const validatedData = validateSchema(createMajorSchema, body);

  // Check if major code already exists
  const existingMajor = await prisma.major.findFirst({
    where: {
      org_unit_id: validatedData.org_unit_id,
      code: validatedData.code,
    }
  });

  if (existingMajor) {
    throw new Error('Major code already exists for this organization unit');
  }

  // Create major
  const major = await prisma.major.create({
    data: {
      ...validatedData,
      status: validatedData.status || 'draft',
    },
    include: {
      OrgUnit: { select: { id: true, name: true, code: true } }
    }
  });

  return { data: major, message: 'Major created successfully' };
}, 'create major');