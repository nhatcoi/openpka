import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
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
  degree_level: z.string().min(1).max(32),
  org_unit_id: z.number(),
  duration_years: z.number().min(0.1).max(10).optional().default(4.0),
  total_credits_min: z.number().min(1).max(1000).optional(),
  total_credits_max: z.number().min(1).max(1000).optional(),
  semesters_per_year: z.number().min(1).max(4).optional().default(2),
  status: z.enum(['DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED']).optional().default('DRAFT'),
  closed_at: z.string().optional(),
});

const MAJOR_SELECT = {
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
} as const;

// GET /api/tms/majors
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    requirePermission(session, 'tms.major.view');
  }
  
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  // Check permission
  requirePermission(session, 'tms.major.create');
  
  const validatedData = validateSchema(createMajorSchema, body);

  // Check if major code already exists
  const existingMajor = await prisma.major.findFirst({
    where: {
      org_unit_id: BigInt(validatedData.org_unit_id),
      code: validatedData.code,
    },
    select: {
      id: true,
      code: true,
    }
  });

  if (existingMajor) {
    throw new Error('Major code already exists for this organization unit');
  }

  // Create major
  const major = await prisma.major.create({
    data: {
      code: validatedData.code,
      name_vi: validatedData.name_vi,
      name_en: validatedData.name_en,
      short_name: validatedData.short_name,
      slug: validatedData.slug,
      degree_level: validatedData.degree_level,
      org_unit_id: BigInt(validatedData.org_unit_id),
      duration_years: validatedData.duration_years,
      total_credits_min: validatedData.total_credits_min,
      total_credits_max: validatedData.total_credits_max,
      semesters_per_year: validatedData.semesters_per_year,
      status: validatedData.status || 'DRAFT',
      closed_at: validatedData.closed_at ? new Date(validatedData.closed_at) : null,
      created_by: BigInt(session.user.id),
    },
    select: MAJOR_SELECT,
  });

  return { data: major, message: 'Major created successfully' };
}, 'create major');