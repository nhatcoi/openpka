import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { WorkflowStatus } from '@/constants/workflow-statuses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get cohort statistics by status
    const statsByStatus = await db.cohort.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Get cohort statistics by academic year
    const statsByAcademicYear = await db.cohort.groupBy({
      by: ['academic_year'],
      _count: {
        id: true
      }
    });

    // Get cohort statistics by intake term
    const statsByIntakeTerm = await db.cohort.groupBy({
      by: ['intake_term'],
      _count: {
        id: true
      }
    });

    // Get total cohorts count
    const totalCount = await db.cohort.count();

    // Get published cohorts
    const publishedCount = await db.cohort.count({
      where: {
        status: WorkflowStatus.PUBLISHED
      }
    });

    // Get cohorts created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await db.cohort.count({
      where: {
        created_at: {
          gte: startOfMonth
        }
      }
    });

    // Get active cohorts (is_active = true)
    const activeCount = await db.cohort.count({
      where: {
        is_active: true
      }
    });

    // Get cohorts with major
    const withMajorCount = await db.cohort.count({
      where: {
        major_id: {
          not: null
        }
      }
    });

    // Get cohorts with program
    const withProgramCount = await db.cohort.count({
      where: {
        program_id: {
          not: null
        }
      }
    });

    // Get cohorts with students
    const withStudentsCount = await db.cohort.count({
      where: {
        StudentAcademicProgress: {
          some: {}
        }
      }
    });

    // Get total quota stats
    const quotaStats = await db.cohort.aggregate({
      _sum: {
        planned_quota: true,
        actual_quota: true
      },
      _avg: {
        planned_quota: true,
        actual_quota: true
      }
    });

    // Transform status results
    const statusStats = {
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      published: 0,
      archived: 0
    };

    statsByStatus.forEach(stat => {
      const count = stat._count.id;
      const status = (stat.status || '').toUpperCase();

      switch (status) {
        case WorkflowStatus.DRAFT:
          statusStats.pending += count;
          break;
        case WorkflowStatus.REVIEWING:
          statusStats.reviewing += count;
          break;
        case WorkflowStatus.APPROVED:
          statusStats.approved += count;
          break;
        case WorkflowStatus.PUBLISHED:
          statusStats.published += count;
          break;
        case WorkflowStatus.REJECTED:
          statusStats.rejected += count;
          break;
        case WorkflowStatus.ARCHIVED:
          statusStats.archived += count;
          break;
        default:
          statusStats.pending += count;
      }
    });

    // Transform academic year results
    const academicYearStats: Record<string, number> = {};
    statsByAcademicYear.forEach(stat => {
      academicYearStats[stat.academic_year || 'unknown'] = stat._count.id;
    });

    // Transform intake term results
    const intakeTermStats: Record<string, number> = {};
    statsByIntakeTerm.forEach(stat => {
      intakeTermStats[stat.intake_term || 'unknown'] = stat._count.id;
    });

    const result = {
      total: totalCount,
      ...statusStats,
      published: publishedCount,
      newThisMonth,
      active: activeCount,
      withMajor: withMajorCount,
      withProgram: withProgramCount,
      withStudents: withStudentsCount,
      totalPlannedQuota: quotaStats._sum.planned_quota || 0,
      totalActualQuota: quotaStats._sum.actual_quota || 0,
      avgPlannedQuota: quotaStats._avg.planned_quota ? Number(quotaStats._avg.planned_quota) : 0,
      avgActualQuota: quotaStats._avg.actual_quota ? Number(quotaStats._avg.actual_quota) : 0,
      byAcademicYear: academicYearStats,
      byIntakeTerm: intakeTermStats
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching cohort stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cohort statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

