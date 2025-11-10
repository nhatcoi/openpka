import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandling, withBody, createSuccessResponse, createErrorResponse, validateSchema } from '@/lib/api/api-handler';

// Updated schema to match database structure
const createMajorSchema = z.object({
  code: z.string().min(1).max(32),
  name_vi: z.string().min(1).max(255),
  name_en: z.string().max(255).optional(),
  short_name: z.string().max(100).optional(),
  slug: z.string().max(255).optional(),
  national_code: z.string().max(32).optional(),
  is_moet_standard: z.boolean().optional().default(false),
  degree_level: z.string().min(1).max(32),
  field_cluster: z.string().max(64).optional(),
  specialization_model: z.string().max(32).optional().default('none'),
  org_unit_id: z.number(),
  duration_years: z.number().min(0.1).max(10).optional().default(4.0),
  total_credits_min: z.number().min(1).max(1000).optional(),
  total_credits_max: z.number().min(1).max(1000).optional(),
  semesters_per_year: z.number().min(1).max(4).optional().default(2),
  start_terms: z.string().max(64).optional().default('Fall'),
  default_quota: z.number().min(0).optional(),
  tuition_group: z.string().max(64).optional(),
  status: z.enum(['DRAFT', 'PROPOSED', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED']).optional().default('DRAFT'),
  established_at: z.string().optional(),
  closed_at: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const MAJOR_SELECT = {
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
} as const;

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

  const [majors, total] = await Promise.all([
    prisma.major.findMany({
      where,
      select: MAJOR_SELECT,
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    }),
    prisma.major.count({ where })
  ]);

  return {
    items: majors,
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
      status: validatedData.status || 'DRAFT',
      established_at: validatedData.established_at ? new Date(validatedData.established_at) : null,
      closed_at: validatedData.closed_at ? new Date(validatedData.closed_at) : null,
    },
    select: MAJOR_SELECT,
  });

  return { data: major, message: 'Major created successfully' };
}, 'create major');