import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';
import { CourseType } from '@/constants/courses';
import { WorkflowStatus } from '@/constants/workflow-statuses';

// Public API endpoints không cần authentication để demo

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const statusParam = searchParams.get('status');
  const normalizedStatus = statusParam?.toUpperCase();
  const search = searchParams.get('search') || undefined;
  const orgUnitId = searchParams.get('orgUnitId');
  const listMode = searchParams.get('list') === 'true';

  const skip = (page - 1) * limit;

  // Build WHERE conditions
  const where: any = {};
  if (orgUnitId) where.org_unit_id = parseInt(orgUnitId);
  if (search) {
    where.OR = [
      { name_vi: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Filter by course status
  if (normalizedStatus) {
    where.status = normalizedStatus;
  }

  // Get total count and courses
  const [total, courses] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      ...(listMode ? {
        select: {
        id: true,
        code: true,
        name_vi: true,
        name_en: true,
        credits: true,
        type: true
        }
      } : {
        include: {
        OrgUnit: {
          select: { name: true }
          }
        }
      }),
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    })
  ]);

  // Serialize BigInt values and flatten structure
  const serializedCourses = listMode 
    ? courses.map((course: any) => ({
        id: course.id.toString(),
        code: course.code,
        name_vi: course.name_vi,
        name_en: course.name_en || '',
        credits: parseFloat(course.credits.toString()),
        type: course.type,
        label: `${course.code} - ${course.name_vi}`,
        value: `${course.code} - ${course.name_vi}`
      }))
    : courses.map((course: any) => ({
        ...course,
        id: course.id.toString(),
        org_unit_id: course.org_unit_id.toString(),
        credits: parseFloat(course.credits.toString()),
        
        // OrgUnit data
        OrgUnit: (course as any).OrgUnit ? {
          ...(course as any).OrgUnit,
          id: (course as any).OrgUnit.id?.toString()
        } : null
      }));

  return {
    items: serializedCourses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}, 'fetch public courses');

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const courseData = body as any;

  // Basic validation
  if (!courseData.code || !courseData.name_vi || !courseData.credits || !courseData.org_unit_id || !courseData.type) {
    throw new Error('Missing required fields: code, name_vi, credits, org_unit_id, type');
  }

  // Get next available ID
  const lastCourse = await db.course.findFirst({
    orderBy: { id: 'desc' }
  });
  const nextId = lastCourse ? lastCourse.id + BigInt(1) : BigInt(1);

  const courseTypeValue = (Object.values(CourseType) as string[]).includes(courseData.type)
    ? (courseData.type as CourseType)
    : CourseType.THEORY;

  const result = await db.$transaction(async (tx: any) => {
    // 1. Create main course record
    const course = await tx.course.create({
      data: {
        id: nextId,
        code: courseData.code,
        name_vi: courseData.name_vi,
        name_en: courseData.name_en || null,
        credits: courseData.credits,
        org_unit_id: BigInt(courseData.org_unit_id),
        type: courseTypeValue,
        description: courseData.description || null,
        status: WorkflowStatus.DRAFT,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    return { course };
  }).catch((error: any) => {
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('org_unit_id') && error.meta?.target?.includes('code')) {
        throw new Error(`Mã môn học '${courseData.code}' đã tồn tại trong đơn vị tổ chức này.`);
      }
    } else if (error.code === 'P2003') {
      if (error.meta?.field_name?.includes('org_unit_id')) {
        throw new Error('Đơn vị tổ chức không hợp lệ.');
      }
    }
    throw error;
  });

  return {
    message: 'Course created successfully',
    data: result
  };
}, 'create public course');
