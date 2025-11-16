import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all statistics in parallel
    const [
      programStats,
      courseStats,
      majorStats,
      cohortStats,
    ] = await Promise.all([
      // Program statistics
      db.program.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Course statistics
      db.course.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Major statistics (all majors, not just active)
      db.major.count(),

      // Cohort statistics
      (db as any).cohort.count(),
    ]);

    // Calculate program statistics
    const programCounts = {
      total: 0,
      draft: 0,
      published: 0,
      approved: 0,
      reviewing: 0,
    };

    programStats.forEach((stat) => {
      const count = stat._count.id;
      programCounts.total += count;
      const status = (stat.status || '').toUpperCase();
      
      if (status === 'DRAFT') programCounts.draft += count;
      else if (status === 'PUBLISHED') programCounts.published += count;
      else if (status === 'APPROVED') programCounts.approved += count;
      else if (status === 'REVIEWING') programCounts.reviewing += count;
    });

    // Calculate course statistics
    const courseCounts = {
      total: 0,
      draft: 0,
      published: 0,
      approved: 0,
      reviewing: 0,
    };

    courseStats.forEach((stat) => {
      const count = stat._count.id;
      courseCounts.total += count;
      const status = (stat.status || '').toUpperCase();
      
      if (status === 'DRAFT') courseCounts.draft += count;
      else if (status === 'PUBLISHED') courseCounts.published += count;
      else if (status === 'APPROVED') courseCounts.approved += count;
      else if (status === 'REVIEWING') courseCounts.reviewing += count;
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          programs: programCounts,
          courses: courseCounts,
          majors: majorStats,
          cohorts: cohortStats,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
        details: message,
      },
      { status: 500 },
    );
  }
}

