import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { requirePermission } from '@/lib/auth/api-permissions';
import { CreateCourseInput } from '@/lib/api/schemas/course';
import {
  CoursePrerequisiteType,
  CourseType,
} from '@/constants/courses';
import { WorkflowStatus } from '@/constants/workflow-statuses';


// GET /api/tms/courses
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }
    
    // Check permission
    requirePermission(session, 'tms.course.view');

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
    
    // Filter by course status and workflow stage
    if (normalizedStatus) {
        where.status = normalizedStatus;
    }

    // Get total count and courses
    const [total, courses] = await Promise.all([
        db.course.count({ where }),
        db.course.findMany({
        where,
        include: {
            OrgUnit: {
            select: { name: true }
            }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
        })
    ]);

    // Transform Decimal fields to numbers for JSON serialization
    const transformedCourses = courses.map((course: any) => ({
        ...course,
        theory_credit: course.theory_credit ? Number(course.theory_credit) : null,
        practical_credit: course.practical_credit ? Number(course.practical_credit) : null,
    }));

    return {
        items: transformedCourses,
        pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
        }
    };
  },
  'fetch courses'
);


// POST /api/tms/courses 
export const POST = withBody(
  async (body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }
    
    // Check permission
    requirePermission(session, 'tms.course.create');

    const courseData = body as CreateCourseInput;

    // Basic validation
    if (!courseData.code || !courseData.name_vi || !courseData.credits || !courseData.org_unit_id || !courseData.type) {
      throw new Error('Missing required fields: code, name_vi, credits, org_unit_id, type');
    }

    // Get next available ID
    const lastCourse = await db.course.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = lastCourse ? lastCourse.id + BigInt(1) : BigInt(1);

    // workflow_priority removed - not needed
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
          theory_credit: courseData.theory_credit || null,
          practical_credit: courseData.practical_credit || null,
          org_unit_id: BigInt(courseData.org_unit_id),
          type: courseTypeValue,
          description: courseData.description || null,
          status: WorkflowStatus.DRAFT,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });

      // 2. Create CourseVersion record (Version 1)
      const courseVersion = await tx.courseVersion.create({
        data: {
          course_id: course.id,
          version: '1',
          status: WorkflowStatus.DRAFT,
          effective_from: new Date(),
          effective_to: null,
        }
      });

      // 3. Create CoursePrerequisites records if provided
      const prerequisites = [];
      if (courseData.prerequisites && Array.isArray(courseData.prerequisites) && courseData.prerequisites.length > 0) {
        for (const prereq of courseData.prerequisites) {
          const prereqId = typeof prereq === 'string' ? prereq : ((prereq as any).value || (prereq as any).id);
          if (!prereqId) {
            continue;
          }
          const prerequisite = await tx.coursePrerequisites.create({
            data: {
              course_id: course.id,
              prerequisite_course_id: BigInt(prereqId),
              prerequisite_type: CoursePrerequisiteType.PRIOR,
              description: "Prerequisite course",
              created_at: new Date(),
            }
          });
          prerequisites.push(prerequisite);
        }
      }

      return { 
        course, 
        courseVersion, 
        prerequisites
      };
    }).catch((error: any) => {
      if (error.code === 'P2002') {
        // Unique constraint violation
        if (error.meta?.target?.includes('org_unit_id') && error.meta?.target?.includes('code')) {
          throw new Error(`Mã môn học '${courseData.code}' đã tồn tại trong đơn vị tổ chức này.`);
        }
      } else if (error.code === 'P2003') {
        // Foreign key constraint violation
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
  },
  'create course'
);
