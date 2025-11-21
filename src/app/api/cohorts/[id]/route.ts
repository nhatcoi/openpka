import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';

// GET /api/cohorts/[id] - Lấy chi tiết khóa học
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Remove authentication requirement for now
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id } = await params;

    // Validate cohort ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid cohort ID' }, { status: 400 });
    }

    const cohortId = BigInt(id);
    console.log('Looking for cohort with ID:', cohortId.toString());

    const cohort = await (db as any).cohort.findUnique({
      where: { id: cohortId },
      include: {
        StudentAcademicProgress: {
          select: {
            id: true,
            student_id: true,
            status: true,
            gpa: true
          }
        }
      }
    });

    console.log('Found cohort:', cohort ? 'Yes' : 'No');

    if (!cohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    // Fetch related entities if IDs exist
    const [major, program, orgUnit] = await Promise.all([
      cohort.major_id ? (db as any).major.findUnique({
        where: { id: cohort.major_id },
        select: { id: true, code: true, name_vi: true }
      }).catch(() => null) : Promise.resolve(null),
      cohort.program_id ? (db as any).program.findUnique({
        where: { id: cohort.program_id },
        select: { id: true, code: true, name_vi: true }
      }).catch(() => null) : Promise.resolve(null),
      cohort.org_unit_id ? (db as any).orgUnit.findUnique({
        where: { id: cohort.org_unit_id },
        select: { id: true, code: true, name: true }
      }).catch(() => null) : Promise.resolve(null)
    ]);

    // Calculate statistics
    const totalStudents = cohort.StudentAcademicProgress?.length || 0;
    const activeStudents = cohort.StudentAcademicProgress?.filter(
      (progress: any) => progress.status === 'ACTIVE'
    ).length || 0;
    const graduatedStudents = cohort.StudentAcademicProgress?.filter(
      (progress: any) => progress.status === 'GRADUATED'
    ).length || 0;

    const averageGpa = totalStudents > 0
      ? cohort.StudentAcademicProgress.reduce((sum: number, progress: any) => sum + (Number(progress.gpa) || 0), 0) / totalStudents
      : 0;

    const completionRate = totalStudents > 0
      ? (graduatedStudents / totalStudents) * 100
      : 0;

    const stats = {
      total_students: totalStudents,
      active_students: activeStudents,
      graduated_students: graduatedStudents,
      average_gpa: averageGpa,
      completion_rate: completionRate
    };

    // Transform cohort data
    const transformedCohort = {
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
      students: cohort.StudentAcademicProgress?.map((progress: any) => ({
        id: progress.id.toString(),
        student_id: progress.student_id?.toString(),
        status: progress.status,
        gpa: Number(progress.gpa) || 0
      })) || [],
      Major: major ? {
        id: major.id.toString(),
        code: major.code,
        name_vi: major.name_vi
      } : undefined,
      Program: program ? {
        id: program.id.toString(),
        code: program.code,
        name_vi: program.name_vi
      } : undefined,
      OrgUnit: orgUnit ? {
        id: orgUnit.id.toString(),
        code: orgUnit.code,
        name: orgUnit.name
      } : undefined
    };

    return NextResponse.json({
      cohort: transformedCohort,
      stats
    });

  } catch (error) {
    console.error('Error fetching cohort:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/cohorts/[id] - Cập nhật khóa học
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cohortId = BigInt(id);
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
      description,
      workflow_notes
    } = body;

    // Check if cohort exists
    const existingCohort = await (db as any).cohort.findUnique({
      where: { id: cohortId }
    });

    if (!existingCohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if new code already exists
    if (code && code !== existingCohort.code) {
      const codeExists = await (db as any).cohort.findFirst({
        where: { 
          code,
          id: { not: cohortId }
        }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Cohort code already exists' },
          { status: 400 }
        );
      }
    }

    const actorId = BigInt(session.user.id);

    // Get request context and actor info for history tracking
    const requestContext = getRequestContext(request);
    const actorInfo = await getActorInfo(session.user.id, db);

    // Wrap update in transaction for workflow
    const updatedCohort = await (db as any).$transaction(async (tx: any) => {
      // IMPORTANT: Set history context FIRST before any other queries
      // This ensures session variables are available when triggers fire
      await setHistoryContext(tx, {
        ...(actorInfo.actorId && { actorId: actorInfo.actorId }),
        ...(actorInfo.actorName && { actorName: actorInfo.actorName }),
        ...(requestContext.userAgent && { userAgent: requestContext.userAgent }),
        metadata: {
          cohort_id: cohortId.toString(),
          status: status,
        },
      });

      // Update cohort
      const updated = await tx.cohort.update({
        where: { id: cohortId },
        data: {
          code: code || existingCohort.code,
          name_vi: name_vi || existingCohort.name_vi,
          name_en: name_en !== undefined ? name_en : existingCohort.name_en,
          academic_year: academic_year || existingCohort.academic_year,
          intake_year: intake_year || existingCohort.intake_year,
          intake_term: intake_term || existingCohort.intake_term,
          major_id: major_id ? BigInt(major_id) : existingCohort.major_id,
          program_id: program_id ? BigInt(program_id) : existingCohort.program_id,
          org_unit_id: org_unit_id ? BigInt(org_unit_id) : existingCohort.org_unit_id,
          planned_quota: planned_quota !== undefined ? planned_quota : existingCohort.planned_quota,
          actual_quota: actual_quota !== undefined ? actual_quota : existingCohort.actual_quota,
          start_date: start_date ? new Date(start_date) : existingCohort.start_date,
          expected_graduation_date: expected_graduation_date ? new Date(expected_graduation_date) : existingCohort.expected_graduation_date,
          status: status || existingCohort.status,
          is_active: is_active !== undefined ? is_active : existingCohort.is_active,
          description: description !== undefined ? description : existingCohort.description
        }
      });

      // If status was directly provided, persist an approval history entry
      const directStatus = status as string | undefined;
      if (directStatus && directStatus !== existingCohort.status) {
        // Ensure workflow instance exists
        let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('COHORT' as any, cohortId);
        if (!workflowInstance) {
          workflowInstance = await academicWorkflowEngine.createWorkflow({
            entityType: 'COHORT' as any,
            entityId: cohortId,
            initiatedBy: actorId,
            metadata: { cohort_id: cohortId.toString() },
          }) as any;
        }

        const mapStatusToAction = (s: string): string => {
          const normalized = (s || '').toUpperCase();
          if (normalized.includes('RECRUITING')) return 'REVIEW';
          if (normalized.includes('ACTIVE')) return 'APPROVE';
          if (normalized.includes('SUSPENDED')) return 'REJECT';
          if (normalized.includes('GRADUATED')) return 'PUBLISH';
          return 'RETURN';
        };

        await tx.approvalRecord.create({
          data: {
            workflow_instance_id: BigInt((workflowInstance as any).id),
            approver_id: actorId,
            action: mapStatusToAction(directStatus),
            comments: workflow_notes || null,
            approved_at: new Date(),
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      cohort: {
        id: updatedCohort.id.toString(),
        code: updatedCohort.code,
        name_vi: updatedCohort.name_vi,
        name_en: updatedCohort.name_en,
        academic_year: updatedCohort.academic_year,
        intake_year: updatedCohort.intake_year,
        intake_term: updatedCohort.intake_term,
        major_id: updatedCohort.major_id?.toString(),
        program_id: updatedCohort.program_id?.toString(),
        org_unit_id: updatedCohort.org_unit_id?.toString(),
        planned_quota: updatedCohort.planned_quota,
        actual_quota: updatedCohort.actual_quota,
        start_date: updatedCohort.start_date?.toISOString().split('T')[0],
        expected_graduation_date: updatedCohort.expected_graduation_date?.toISOString().split('T')[0],
        status: updatedCohort.status,
        is_active: updatedCohort.is_active,
        description: updatedCohort.description,
        created_at: updatedCohort.created_at.toISOString(),
        updated_at: updatedCohort.updated_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating cohort:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/cohorts/[id] - Xóa khóa học
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cohortId = BigInt(id);

    // Check if cohort exists
    const existingCohort = await (db as any).cohort.findUnique({
      where: { id: cohortId },
      select: {
        id: true,
        status: true,
        StudentAcademicProgress: {
          select: { id: true }
        }
      }
    });

    if (!existingCohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    
    if (existingCohort.status === WorkflowStatus.PUBLISHED || existingCohort.status === 'PUBLISHED' || existingCohort.status === 'GRADUATED') {
      const actorId = BigInt(session.user.id);
      const requestContext = getRequestContext(request);
      const actorInfo = await getActorInfo(session.user.id, db);

      await (db as any).$transaction(async (tx: any) => {
        await setHistoryContext(tx, {
          ...(actorInfo.actorId && { actorId: actorInfo.actorId }),
          ...(actorInfo.actorName && { actorName: actorInfo.actorName }),
          ...(requestContext.userAgent && { userAgent: requestContext.userAgent }),
          metadata: {
            cohort_id: cohortId.toString(),
            status: WorkflowStatus.ARCHIVED,
            action: 'soft_delete',
          },
        });

        await tx.cohort.update({
          where: { id: cohortId },
          data: { 
            status: WorkflowStatus.ARCHIVED,
            updated_at: new Date(),
            updated_by: actorId,
          },
        });
      });

      return NextResponse.json({ 
        success: true,
        message: 'Cohort đã được chuyển sang trạng thái Lưu trữ (xóa mềm)',
        data: {
          id: id,
          status: WorkflowStatus.ARCHIVED
        }
      });
    }

    if (existingCohort.StudentAcademicProgress.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete cohort with existing students' },
        { status: 400 }
      );
    }

    // Delete cohort
    await (db as any).cohort.delete({
      where: { id: cohortId }
    });

    return NextResponse.json({ message: 'Cohort deleted successfully' });

  } catch (error) {
    console.error('Error deleting cohort:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
