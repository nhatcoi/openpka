import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { WorkflowStatus } from '@/constants/workflow-statuses';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get program statistics by status
    const statsByStatus = await db.program.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Get program statistics by version
    const statsByVersion = await db.program.groupBy({
      by: ['version'],
      _count: {
        id: true,
      },
    });

    // Get total programs count
    const totalCount = await db.program.count();

    // Get published programs
    const publishedCount = await db.program.count({
      where: {
        status: WorkflowStatus.PUBLISHED,
      },
    });

    // Get programs with major
    const withMajorCount = await db.program.count({
      where: {
        major_id: {
          not: null,
        },
      },
    });

    // Get programs created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await db.program.count({
      where: {
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    // Get active programs (effective_from <= now <= effective_to)
    const now = new Date();
    const activeCount = await db.program.count({
      where: {
        OR: [
          {
            effective_from: {
              lte: now,
            },
            effective_to: {
              gte: now,
            },
          },
          {
            effective_from: {
              lte: now,
            },
            effective_to: null,
          },
        ],
      },
    });

    // Get total credits
    const totalCreditsResult = await db.program.aggregate({
      _sum: {
        total_credits: true,
      },
    });

    // Get programs with courses
    const withCoursesCount = await db.program.count({
      where: {
        ProgramCourseMap: {
          some: {},
        },
      },
    });

    // Transform status results
    const statusStats = {
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      published: 0,
      archived: 0,
    };

    statsByStatus.forEach((stat) => {
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
          break;
      }
    });

    // Transform version results
    const versionStats: Record<string, number> = {};
    statsByVersion.forEach((stat) => {
      versionStats[stat.version || 'unknown'] = stat._count.id;
    });

    const result = {
      total: totalCount,
      ...statusStats,
      published: publishedCount,
      newThisMonth,
      withMajor: withMajorCount,
      active: activeCount,
      withCourses: withCoursesCount,
      totalCredits: totalCreditsResult._sum.total_credits || 0,
      byVersion: versionStats,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching program stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch program statistics',
        details: message,
      },
      { status: 500 },
    );
  }
}
