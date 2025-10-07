import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, withIdParam, withIdAndBody, createErrorResponse, createSuccessResponse } from '@/lib/api/api-handler';
import { UpdateCourseInput } from '@/lib/api/schemas/course';
import {
  CourseStatus,
  CourseType,
  WorkflowStage,
  normalizeCoursePriority,
} from '@/constants/courses';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

// GET /api/tms/courses/[id] - Lấy chi tiết course
const getCourseById = async (id: string, request: Request) => {
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   return createErrorResponse('Unauthorized', 'Authentication required', 401);
  // }

  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('Invalid course ID');
  }

  const course = await db.course.findUnique({
    where: { id: BigInt(courseId) },
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      credits: true,
      theory_credit: true,
      practical_credit: true,
      type: true,
      status: true,
      org_unit_id: true,
      created_at: true,
      updated_at: true,
      description: true,
      OrgUnit: {
        select: { name: true, code: true }
      },
      // Legacy workflow data removed - using unified workflow system
      contents: {
        select: {
          id: true,
          prerequisites: true,
          learning_objectives: true,
          assessment_methods: true,
          passing_grade: true,
          created_at: true,
          updated_at: true
        }
      },
      audits: {
        select: {
          id: true,
          created_by: true,
          updated_by: true,
          created_at: true,
          updated_at: true
        }
      },
      // Legacy approval history removed - using unified workflow system
      instructor_qualifications: {
        select: {
          id: true,
          instructor_id: true,
          qualification_type: true,
          qualification_level: true,
          status: true,
          valid_from: true,
          valid_to: true
        }
      },
      CourseVersion: {
        include: {
          CourseSyllabus: {
            orderBy: { week_number: 'asc' },
            select: {
              id: true,
              week_number: true,
              topic: true,
              teaching_methods: true,
              materials: true,
              assignments: true,
              duration_hours: true,
              is_exam_week: true,
              created_by: true,
              created_at: true
            }
          }
        }
      },
      prerequisites: {
        include: {
          prerequisite_course: {
            select: { id: true, code: true, name_vi: true }
          }
        }
      }
    }
  });

  if (!course) {
    throw new Error('Course not found');
  }



  // Fetch unified workflow data separately
  const workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('COURSE', BigInt(courseId));

  // Transform Decimal fields to numbers for JSON serialization
  const transformedCourse = {
    ...course,
    theory_credit: course.theory_credit ? Number(course.theory_credit) : null,
    practical_credit: course.practical_credit ? Number(course.practical_credit) : null,
    // Add unified workflow data
    unified_workflow: workflowInstance ? {
      id: workflowInstance.id,
      status: workflowInstance.status,
      current_step: workflowInstance.current_step,
      initiated_at: workflowInstance.initiated_at,
      completed_at: workflowInstance.completed_at,
      workflow: workflowInstance.workflow,
      approval_records: workflowInstance.approval_records
    } : null
  };

  return transformedCourse;
};

// PUT /api/tms/courses/[id] - Cập nhật course
const updateCourse = async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('Invalid course ID');
  }

  const courseData = body as any;
  const prerequisitesString = courseData.prerequisites?.map((p: any) => typeof p === 'string' ? p : p.label).join(', ') || null;

  const toCourseStatus = (value: unknown): CourseStatus | undefined => {
    if (!value) return undefined;
    const upper = String(value).toUpperCase();
    return (Object.values(CourseStatus) as string[]).includes(upper) ? (upper as CourseStatus) : undefined;
  };

  const toWorkflowStage = (value: unknown): WorkflowStage | undefined => {
    if (!value) return undefined;
    const upper = String(value).toUpperCase();
    return (Object.values(WorkflowStage) as string[]).includes(upper) ? (upper as WorkflowStage) : undefined;
  };

  const toCourseType = (value: unknown): CourseType | undefined => {
    if (!value) return undefined;
    const str = String(value);
    return (Object.values(CourseType) as string[]).includes(str) ? (str as CourseType) : undefined;
  };

  const resolvedStatus = toCourseStatus(courseData.status);
  const resolvedWorkflowStage = toWorkflowStage(courseData.workflow_stage);
  const resolvedPriority = normalizeCoursePriority(courseData.workflow_priority).toLowerCase();
  const resolvedType = toCourseType(courseData.type);

  // Determine current user's active role
  let currentUserRoleName: string | null = null;
  let currentUserRoleDescription: string | null = null;
  try {
    const activeUserRole = await db.userRole.findFirst({
      where: { user_id: BigInt(session.user.id), is_active: true },
      include: { Role: { select: { name: true, description: true } } },
      orderBy: { assigned_at: 'desc' }
    });
    const rawName = (activeUserRole?.Role as any)?.name as string | undefined;
    currentUserRoleName = rawName ? rawName.toLowerCase() : null;
    const rawDesc = (activeUserRole?.Role as any)?.description as string | undefined;
    currentUserRoleDescription = rawDesc ?? null;
  } catch (e) {
    // fallback silently
    currentUserRoleName = null;
    currentUserRoleDescription = null;
  }

  // Remove role-to-stage mapping: we will store reviewer_role exactly as current user role

  const result = await db.$transaction(async (tx) => {
    // 1. Update main course record
    const updatedCourse = await tx.course.update({
      where: { id: BigInt(courseId) },
      data: {
        code: courseData.code,
        name_vi: courseData.name_vi,
        name_en: courseData.name_en || null,
        credits: courseData.credits,
        theory_credit: (courseData as any).theory_credit || null,
        practical_credit: (courseData as any).practical_credit || null,
        ...(courseData.org_unit_id && { org_unit_id: BigInt(courseData.org_unit_id) }),
        ...(resolvedType && { type: resolvedType }),
        ...(resolvedStatus && { status: resolvedStatus }),
        description: courseData.description || null,
        updated_at: new Date(),
      }
    });

    // 2. Legacy workflow update removed - using unified workflow system

    // 3. Update CourseContent record (only set fields that are provided)
    const contentUpdateData: any = {};
    if (Object.prototype.hasOwnProperty.call(courseData, 'prerequisites')) {
      contentUpdateData.prerequisites = prerequisitesString;
    }
    if (Object.prototype.hasOwnProperty.call(courseData, 'learning_objectives')) {
      contentUpdateData.learning_objectives = courseData.learning_objectives as any;
    }
    if (Object.prototype.hasOwnProperty.call(courseData, 'assessment_methods')) {
      contentUpdateData.assessment_methods = courseData.assessment_methods as any;
    }
    if (Object.prototype.hasOwnProperty.call(courseData, 'passing_grade')) {
      contentUpdateData.passing_grade = courseData.passing_grade as any;
    }
    let updatedContent: any = null;
    if (Object.keys(contentUpdateData).length > 0) {
      contentUpdateData.updated_at = new Date();
      updatedContent = await tx.courseContent.updateMany({
        where: { course_id: BigInt(courseId) },
        data: contentUpdateData
      });
    }

    // 4. Update CourseAudit record
    const updatedAudit = await tx.courseAudit.updateMany({
      where: { course_id: BigInt(courseId) },
      data: {
        updated_by: BigInt(session.user.id),
        updated_at: new Date(),
      }
    });

    // 5. Update syllabus if provided
    if (courseData.syllabus && Array.isArray(courseData.syllabus)) {
      // Resolve course version (use latest, or create if none)
      let courseVersion = await tx.courseVersion.findFirst({
        where: { course_id: BigInt(courseId) },
        orderBy: { created_at: 'desc' }
      });
      if (!courseVersion) {
        courseVersion = await tx.courseVersion.create({
          data: {
            course_id: BigInt(courseId),
            version: '1',
            status: CourseStatus.DRAFT,
          }
        });
      }

      // Delete existing syllabus for this version
      await tx.courseSyllabus.deleteMany({
        where: { course_version_id: courseVersion.id }
      });

      // Create new syllabus entries for this version
      if (courseData.syllabus.length > 0) {
        await tx.courseSyllabus.createMany({
          data: courseData.syllabus.map((week: any) => ({
            course_version_id: courseVersion!.id,
            week_number: week.week,
            topic: week.topic,
            teaching_methods: null,
            materials: week.materials ?? null,
            assignments: week.assignments ?? null,
            duration_hours: week.duration ?? 3,
            is_exam_week: week.isExamWeek ?? false
          }))
        });
      }
    }

    // 6. Update instructors if provided (replace strategy)
    if (Array.isArray((courseData as any).instructors)) {
      await tx.instructorQualifications.deleteMany({
        where: { course_id: BigInt(courseId) }
      });
      const instructors = (courseData as any).instructors as any[];
      if (instructors.length > 0) {
        await tx.instructorQualifications.createMany({
          data: instructors.map((ins: any) => ({
            instructor_id: BigInt(ins.instructor_id ?? ins.id ?? ins.employee_id),
            course_id: BigInt(courseId),
            qualification_type: ins.qualification_type ?? ins.qualification ?? 'GENERAL',
            qualification_level: ins.qualification_level ?? ins.level ?? 'STANDARD',
            status: ins.status ?? 'PENDING',
            valid_from: ins.valid_from ? new Date(ins.valid_from) : null,
            valid_to: ins.valid_to ? new Date(ins.valid_to) : null
          }))
        });
      }
    }

    // 7. Handle workflow actions via unified academic workflow system
    if ((courseData as any).workflow_action) {
      const workflowAction = (courseData as any).workflow_action;
      const comment = (courseData as any).comment || '';
      
      // Get or create workflow instance for this course
      let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('COURSE', BigInt(courseId));
      
      if (!workflowInstance) {
        // Create new workflow instance if doesn't exist
        workflowInstance = await academicWorkflowEngine.createWorkflow({
          entityType: 'COURSE',
          entityId: BigInt(courseId),
          initiatedBy: BigInt(session?.user?.id || 1),
          metadata: {
            course_id: courseId,
            legacy_migration: true
          }
        });
      }

      // Check if workflow is already completed
      if (workflowInstance.status === 'COMPLETED' || workflowInstance.status === 'REJECTED') {
        // Skip workflow action if already completed
        console.log(`Workflow instance ${workflowInstance.id} is already ${workflowInstance.status}, skipping action`);
      } else {
        // Process workflow action using unified system
        const updatedInstance = await academicWorkflowEngine.processAction(workflowInstance.id, {
          action: workflowAction,
          comments: comment,
          approverId: BigInt(session?.user?.id || 1)
        });

        // Update course status based on workflow status
        let courseStatus = resolvedStatus;
        switch (updatedInstance.status) {
          case 'PENDING':
            courseStatus = CourseStatus.DRAFT;
            break;
          case 'IN_PROGRESS':
            courseStatus = CourseStatus.REVIEWING;
            break;
          case 'APPROVED':
            courseStatus = CourseStatus.APPROVED;
            break;
          case 'REJECTED':
            courseStatus = CourseStatus.REJECTED;
            break;
          case 'COMPLETED':
            courseStatus = CourseStatus.PUBLISHED;
            break;
        }

        // Update course status
        await tx.course.update({
          where: { id: BigInt(courseId) },
          data: { status: courseStatus }
        });
      }
    }

    return { updatedCourse, updatedContent, updatedAudit };
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

  // Sau khi update thành công, fetch lại dữ liệu đầy đủ
  const updatedCourseData = await getCourseById(courseId.toString(), request);
  return updatedCourseData;
};

// DELETE /api/tms/courses/[id] - Xóa course
const deleteCourse = async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('Invalid course ID');
  }

  // Check if course exists
  const course = await db.course.findUnique({
    where: { id: BigInt(courseId) }
  });

  if (!course) {
    throw new Error('Course not found');
  }

  // Delete course (cascade will handle related records in course_contents, course_audits, etc.)
  await db.course.delete({
    where: { id: BigInt(courseId) }
  });

  return 'Course deleted successfully';
};

// Export handlers with error handling (inline)
export const GET = withIdParam(async (id: string, request: Request) => {
  return await getCourseById(id, request);
}, 'fetch course by id');

export const PUT = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  return await updateCourse(id, body, request);
}, 'update course');

export const DELETE = withIdParam(async (id: string, request: Request) => {
  return await deleteCourse(id, request);
}, 'delete course');
