import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth/auth';
import { db } from '../../../../../lib/db';
import { WorkflowStatus } from '@/constants/workflow-statuses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get course statistics by status
    const statsByStatus = await db.course.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    // Get course statistics by type
    const statsByType = await db.course.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    // Get total courses count
    const totalCount = await db.course.count();

    // Get courses with prerequisites
    const coursesWithPrereqs = await db.course.count({
      where: {
        prerequisites: {
          some: {}
        }
      }
    });

    // Get published courses
    const publishedCount = await db.course.count({
      where: {
        status: WorkflowStatus.PUBLISHED
      }
    });

    // Get courses created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await db.course.count({
      where: {
        created_at: {
          gte: startOfMonth
        }
      }
    });

    // Get total credits
    const totalCreditsResult = await db.course.aggregate({
      _sum: {
        credits: true
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

    // Transform type results
    const typeStats: Record<string, number> = {};
    statsByType.forEach(stat => {
      typeStats[stat.type || 'unknown'] = stat._count.id;
    });

    const result = {
      total: totalCount,
      ...statusStats,
      published: publishedCount,
      newThisMonth,
      withPrerequisites: coursesWithPrereqs,
      totalCredits: totalCreditsResult._sum.credits ? Number(totalCreditsResult._sum.credits) : 0,
      byType: typeStats
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching course stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course statistics', details: error.message },
      { status: 500 }
    );
  }
}
