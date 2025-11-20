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

    // Get major statistics by status
    const statsByStatus = await db.major.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Get major statistics by degree level
    const statsByDegreeLevel = await db.major.groupBy({
      by: ['degree_level'],
      _count: {
        id: true
      }
    });

    // Get total majors count
    const totalCount = await db.major.count();

    // Get published majors
    const publishedCount = await db.major.count({
      where: {
        status: WorkflowStatus.PUBLISHED
      }
    });

    // Get majors created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await db.major.count({
      where: {
        created_at: {
          gte: startOfMonth
        }
      }
    });

    // Get active majors (is_active = true)
    const activeCount = await db.major.count({
      where: {
        is_active: true
      }
    });

    // Get majors with programs
    const withProgramsCount = await db.major.count({
      where: {
        Program: {
          some: {}
        }
      }
    });

    // Get total credits range
    const creditsStats = await db.major.aggregate({
      _avg: {
        total_credits_min: true,
        total_credits_max: true
      },
      _sum: {
        total_credits_min: true,
        total_credits_max: true
      }
    });

    // Get closed majors
    const closedCount = await db.major.count({
      where: {
        closed_at: {
          not: null
        }
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

    // Transform degree level results
    const degreeLevelStats: Record<string, number> = {};
    statsByDegreeLevel.forEach(stat => {
      degreeLevelStats[stat.degree_level || 'unknown'] = stat._count.id;
    });

    const result = {
      total: totalCount,
      ...statusStats,
      published: publishedCount,
      newThisMonth,
      active: activeCount,
      withPrograms: withProgramsCount,
      closed: closedCount,
      avgCreditsMin: creditsStats._avg.total_credits_min ? Number(creditsStats._avg.total_credits_min) : 0,
      avgCreditsMax: creditsStats._avg.total_credits_max ? Number(creditsStats._avg.total_credits_max) : 0,
      totalCreditsMin: creditsStats._sum.total_credits_min || 0,
      totalCreditsMax: creditsStats._sum.total_credits_max || 0,
      byDegreeLevel: degreeLevelStats
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching major stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch major statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

