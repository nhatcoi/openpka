import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

// GET /api/cohorts/statistics - Lấy thống kê khóa học
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get overall statistics
    const [
      totalCohorts,
      activeCohorts,
      graduatedCohorts,
      totalStudents,
      cohortsWithStudents
    ] = await Promise.all([
      (db as any).cohort.count(),
      (db as any).cohort.count({ where: { status: 'ACTIVE' } }),
      (db as any).cohort.count({ where: { status: 'GRADUATED' } }),
      (db as any).studentAcademicProgress.count(),
      (db as any).cohort.findMany({
        include: {
          StudentAcademicProgress: {
            select: {
              id: true,
              status: true,
              gpa: true
            }
          }
        }
      })
    ]);

    // Calculate average students per cohort
    const averageStudentsPerCohort = totalCohorts > 0 ? totalStudents / totalCohorts : 0;

    // Calculate overall completion rate
    const graduatedStudents = cohortsWithStudents.reduce((sum, cohort) => {
      return sum + cohort.StudentAcademicProgress.filter(progress => progress.status === 'GRADUATED').length;
    }, 0);

    const overallCompletionRate = totalStudents > 0 ? (graduatedStudents / totalStudents) * 100 : 0;

    const stats = {
      total_cohorts: totalCohorts,
      active_cohorts: activeCohorts,
      graduated_cohorts: graduatedCohorts,
      total_students: totalStudents,
      average_students_per_cohort: averageStudentsPerCohort,
      completion_rate: overallCompletionRate
    };

    // Get cohort summaries
    const cohortSummaries = cohortsWithStudents.map(cohort => {
      const studentCount = cohort.StudentAcademicProgress.length;
      const graduatedCount = cohort.StudentAcademicProgress.filter(
        progress => progress.status === 'GRADUATED'
      ).length;
      const completionRate = studentCount > 0 ? (graduatedCount / studentCount) * 100 : 0;

      return {
        id: cohort.id.toString(),
        code: cohort.code,
        name_vi: cohort.name_vi,
        academic_year: cohort.academic_year,
        intake_year: cohort.intake_year,
        status: cohort.status,
        planned_quota: cohort.planned_quota,
        actual_quota: cohort.actual_quota,
        student_count: studentCount,
        completion_rate: completionRate
      };
    });

    // Sort by intake year descending
    cohortSummaries.sort((a, b) => b.intake_year - a.intake_year);

    return NextResponse.json({
      stats,
      cohorts: cohortSummaries
    });

  } catch (error) {
    console.error('Error fetching cohort statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
