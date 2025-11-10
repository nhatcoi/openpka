import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

// GET /api/cohorts - Lấy danh sách khóa học
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const majorId = searchParams.get('major_id') || '';
    const programId = searchParams.get('program_id') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name_vi: { contains: search, mode: 'insensitive' } },
        { name_en: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (majorId) {
      where.major_id = BigInt(majorId);
    }

    if (programId) {
      where.program_id = BigInt(programId);
    }

    // Get cohorts with related data
    const [cohorts, total] = await Promise.all([
      (db as any).cohort.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { intake_year: 'desc' },
          { intake_term: 'asc' },
          { code: 'asc' }
        ],
        include: {
          StudentAcademicProgress: {
            select: {
              id: true,
              student_id: true,
            }
          }
        }
      }),
      (db as any).cohort.count({ where })
    ]);

    // Transform data
    const transformedCohorts = cohorts.map((cohort: any) => ({
      id: cohort.id.toString(),
      code: cohort.code,
      name_vi: cohort.name_vi,
      name_en: cohort.name_en,
      academic_year: cohort.academic_year,
      intake_year: cohort.intake_year,
      intake_term: cohort.intake_term,
      major_id: cohort.major_id?.toString(),
      program_id: cohort.program_id?.toString(),
      org_unit_id: cohort.org_unit_id?.toString(),
      planned_quota: cohort.planned_quota,
      actual_quota: cohort.actual_quota,
      start_date: cohort.start_date?.toISOString().split('T')[0],
      expected_graduation_date: cohort.expected_graduation_date?.toISOString().split('T')[0],
      status: cohort.status,
      is_active: cohort.is_active,
      description: cohort.description,
      created_at: cohort.created_at.toISOString(),
      updated_at: cohort.updated_at.toISOString(),
      student_count: cohort.StudentAcademicProgress.length
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      cohorts: transformedCohorts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/cohorts - Tạo khóa học mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name_vi,
      name_en,
      academic_year,
      intake_year,
      intake_term,
      major_id,
      program_id,
      org_unit_id,
      planned_quota,
      actual_quota,
      start_date,
      expected_graduation_date,
      status,
      is_active,
      description
    } = body;

    // Validate required fields
    if (!code || !name_vi || !academic_year || !intake_year || !intake_term) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if cohort code already exists
    const existingCohort = await (db as any).cohort.findFirst({
      where: { code }
    });

    if (existingCohort) {
      return NextResponse.json(
        { error: 'Cohort code already exists' },
        { status: 400 }
      );
    }

    // Create cohort
    const cohort = await (db as any).cohort.create({
      data: {
        code,
        name_vi,
        name_en,
        academic_year,
        intake_year,
        intake_term,
        major_id: major_id ? BigInt(major_id) : null,
        program_id: program_id ? BigInt(program_id) : null,
        org_unit_id: org_unit_id ? BigInt(org_unit_id) : null,
        planned_quota,
        actual_quota,
        start_date: start_date ? new Date(start_date) : null,
        expected_graduation_date: expected_graduation_date ? new Date(expected_graduation_date) : null,
        status: status || 'PLANNING',
        is_active: is_active !== undefined ? is_active : true,
        description,
        created_by: BigInt(session.user.id)
      }
    });

    return NextResponse.json({
      cohort: {
        id: cohort.id.toString(),
        code: cohort.code,
        name_vi: cohort.name_vi,
        name_en: cohort.name_en,
        academic_year: cohort.academic_year,
        intake_year: cohort.intake_year,
        intake_term: cohort.intake_term,
        major_id: cohort.major_id?.toString(),
        program_id: cohort.program_id?.toString(),
        org_unit_id: cohort.org_unit_id?.toString(),
        planned_quota: cohort.planned_quota,
        actual_quota: cohort.actual_quota,
        start_date: cohort.start_date?.toISOString().split('T')[0],
        expected_graduation_date: cohort.expected_graduation_date?.toISOString().split('T')[0],
        status: cohort.status,
        is_active: cohort.is_active,
        description: cohort.description,
        created_at: cohort.created_at.toISOString(),
        updated_at: cohort.updated_at.toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating cohort:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
