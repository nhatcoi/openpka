import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withBody, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';
import { CreateCourseInput, CourseQueryInput } from '@/lib/api/schemas/course';
import {
  CoursePrerequisiteType,
  CourseStatus,
  CourseType,
  WorkflowStage,
  normalizeCoursePriority,
} from '@/constants/courses';


// GET /api/tms/courses
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusParam = searchParams.get('status');
    const normalizedStatus = statusParam?.toUpperCase();
    const search = searchParams.get('search') || undefined;
    const orgUnitId = searchParams.get('orgUnitId');
    const workflowStageParam = searchParams.get('workflowStage');
    const normalizedWorkflowStage = workflowStageParam?.toUpperCase();
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
    if (normalizedStatus && (Object.values(CourseStatus) as string[]).includes(normalizedStatus)) {
        where.status = normalizedStatus as CourseStatus;
    }
    // Note: Legacy workflow filtering removed - use unified workflow system instead
    // if (normalizedWorkflowStage && (Object.values(WorkflowStage) as string[]).includes(normalizedWorkflowStage)) {
    //     where.workflows = {
    //         some: { workflow_stage: normalizedWorkflowStage as WorkflowStage }
    //     };
    // }

    // Get total count and courses
    const [total, courses] = await Promise.all([
        db.course.count({ where }),
        db.course.findMany({
        where,
        include: {
            OrgUnit: {
            select: { name: true }
            },
            // Legacy workflow data removed - using unified workflow system
            contents: listMode ? undefined : {
            select: { prerequisites: true, passing_grade: true }
            },
            audits: listMode ? undefined : {
            select: { created_by: true, created_at: true }
            }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
        })
    ]);

    

    // Transform Decimal fields to numbers for JSON serialization
    const transformedCourses = courses.map(course => ({
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
    // Temporarily use admin id = 1 instead of session
    const userId = BigInt(1); // Default admin user

    const courseData = body as CreateCourseInput;

    // Basic validation
    if (!courseData.code || !courseData.name_vi || !courseData.credits || !courseData.org_unit_id || !courseData.type) {
      throw new Error('Missing required fields: code, name_vi, credits, org_unit_id, type');
    }

    const prerequisitesName = courseData.prerequisites?.map(p => 
      typeof p === 'string' ? p : p.name_vi || p.label
    ).join(', ') || null;

    // Get next available ID
    const lastCourse = await db.course.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = lastCourse ? lastCourse.id + BigInt(1) : BigInt(1);

    const workflowPriorityValue = normalizeCoursePriority(courseData.workflow_priority).toLowerCase();
    const courseTypeValue = (Object.values(CourseType) as string[]).includes(courseData.type)
      ? (courseData.type as CourseType)
      : CourseType.THEORY;

    const result = await db.$transaction(async (tx) => {
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
          created_at: new Date(),
          updated_at: new Date(),
        }
      });

      // 2. Legacy workflow creation removed - using unified workflow system

      // 3. Create CourseContent record
      const lastContent = await tx.courseContent.findFirst({
        orderBy: { id: 'desc' }
      });
      const nextContentId = lastContent ? lastContent.id + BigInt(1) : BigInt(1);
      
      const content = await tx.courseContent.create({
        data: {
          id: nextContentId,
          course_id: course.id,
          prerequisites: prerequisitesName,
          learning_objectives: courseData.learning_objectives || null,
          assessment_methods: courseData.assessment_methods || null,
          passing_grade: courseData.passing_grade || 5.0,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });

      // 4. Create CourseAudit record
      const lastAudit = await tx.courseAudit.findFirst({
        orderBy: { id: 'desc' }
      });
      const nextAuditId = lastAudit ? lastAudit.id + BigInt(1) : BigInt(1);
      
      const audit = await tx.courseAudit.create({
        data: {
          id: nextAuditId,
          course_id: course.id,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });

      // 5. Create CourseVersion record (Version 1)
      const courseVersion = await tx.courseVersion.create({
        data: {
          course_id: course.id,
          version: '1',
          status: CourseStatus.DRAFT,
          effective_from: new Date(),
          effective_to: null,
        }
      });

      // 6. Create CoursePrerequisites records if provided
      let prerequisites = [];
      if (courseData.prerequisites && Array.isArray(courseData.prerequisites) && courseData.prerequisites.length > 0) {
        for (const prereq of courseData.prerequisites) {
          const prereqId = typeof prereq === 'string' ? prereq : (prereq.value || prereq.id);
          if (!prereqId) {
            console.error('Invalid prerequisite ID:', prereq);
            continue;
          }
          const prerequisite = await tx.coursePrerequisites.create({
            data: {
              course_id: course.id,
              prerequisite_course_id: BigInt(prereqId),
              prerequisite_type: CoursePrerequisiteType.PRIOR,
              min_grade: 5.0,
              description: "Prerequisite course",
              created_at: new Date(),
            }
          });
          prerequisites.push(prerequisite);
        }
      }

      // 7. Create CourseSyllabus records if provided
      let syllabusEntries = [];
      if (courseData.syllabus && Array.isArray(courseData.syllabus) && courseData.syllabus.length > 0) {
        for (const week of courseData.syllabus) {
          const syllabusEntry = await tx.courseSyllabus.create({
            data: {
              course_version_id: courseVersion.id,
              week_number: week.week,
              topic: week.topic,
              teaching_methods: week.teaching_methods || null,
              materials: week.materials,
              assignments: week.assignments,
              duration_hours: week.duration_hours || 3.0,
              is_exam_week: week.is_exam_week || false,
              created_by: BigInt(1), // Default admin user
              created_at: new Date(),
            }
          });
          syllabusEntries.push(syllabusEntry);
        }
      }

      return { 
        course, 
        workflow, 
        content, 
        audit, 
        courseVersion, 
        prerequisites, 
        syllabusEntries 
      };
    }).catch((error) => {
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
      throw error; // Re-throw other errors
    });

    return {
      message: 'Course created successfully',
      data: result
    };
  },
  'create course'
);
