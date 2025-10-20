import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

// GET /api/cohorts/[id] - Lấy chi tiết khóa học
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Remove authentication requirement for now
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Validate cohort ID
    if (!params.id || isNaN(parseInt(params.id))) {
      return NextResponse.json({ error: 'Invalid cohort ID' }, { status: 400 });
    }

    const cohortId = BigInt(params.id);
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

    // Calculate statistics
    const totalStudents = cohort.StudentAcademicProgress?.length || 0;
    const activeStudents = cohort.StudentAcademicProgress?.filter(
      progress => progress.status === 'ACTIVE'
    ).length || 0;
    const graduatedStudents = cohort.StudentAcademicProgress?.filter(
      progress => progress.status === 'GRADUATED'
    ).length || 0;

    const averageGpa = totalStudents > 0
      ? cohort.StudentAcademicProgress.reduce((sum, progress) => sum + (Number(progress.gpa) || 0), 0) / totalStudents
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
      students: cohort.StudentAcademicProgress?.map(progress => ({
        id: progress.id.toString(),
        student_id: progress.student_id?.toString(),
        status: progress.status,
        gpa: Number(progress.gpa) || 0
      })) || []
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cohortId = BigInt(params.id);
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

    // Update cohort
    const updatedCohort = await (db as any).cohort.update({
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cohortId = BigInt(params.id);

    // Check if cohort exists
    const existingCohort = await (db as any).cohort.findUnique({
      where: { id: cohortId },
      include: {
        StudentAcademicProgress: true
      }
    });

    if (!existingCohort) {
      return NextResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }

    // Check if cohort has students
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
