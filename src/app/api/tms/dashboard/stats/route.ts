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
      classSectionStats,
      termStats,
      programByMajor,
      courseByStatus,
      recentPrograms,
      recentCourses,
      workflowStats,
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

      // Major statistics (active majors)
      db.major.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      // Class section statistics
      db.classSection.count(),

      // Academic terms
      db.academicTerm.findMany({
        orderBy: { start_date: 'desc' },
        take: 1,
        include: {
          _count: {
            select: {
              ClassSection: true,
            },
          },
        },
      }),

      // Programs by major
      db.program.groupBy({
        by: ['major_id'],
        _count: { id: true },
        where: {
          major_id: { not: null },
        },
      }),

      // Courses by org unit
      db.course.groupBy({
        by: ['org_unit_id'],
        _count: { id: true },
      }),

      // Recent programs (last 5)
      db.program.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          code: true,
          name_vi: true,
          status: true,
          created_at: true,
          Major: {
            select: {
              name_vi: true,
            },
          },
        },
      }),

      // Recent courses (last 5)
      db.course.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          code: true,
          name_vi: true,
          status: true,
          credits: true,
          created_at: true,
        },
      }),

      // Workflow statistics
      db.workflowInstance.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
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

    // Calculate workflow statistics
    const workflowCounts = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    workflowStats.forEach((stat) => {
      const count = stat._count.id;
      workflowCounts.total += count;
      const status = (stat.status || '').toUpperCase();
      
      if (status === 'PENDING') workflowCounts.pending += count;
      else if (status === 'APPROVED') workflowCounts.approved += count;
      else if (status === 'REJECTED') workflowCounts.rejected += count;
    });

    const currentTerm = termStats[0] || null;

    // Convert BigInt to string for JSON serialization
    const serializePrograms = recentPrograms.map((p) => ({
      id: p.id.toString(),
      code: p.code,
      name_vi: p.name_vi,
      status: p.status,
      created_at: p.created_at?.toISOString() || null,
      Major: p.Major,
    }));

    const serializeCourses = recentCourses.map((c) => ({
      id: c.id.toString(),
      code: c.code,
      name_vi: c.name_vi,
      status: c.status,
      credits: Number(c.credits),
      created_at: c.created_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          programs: programCounts,
          courses: courseCounts,
          majors: majorStats,
          classSections: classSectionStats,
          currentTerm: currentTerm
            ? {
                code: currentTerm.code,
                title: currentTerm.title,
                classSections: currentTerm._count.ClassSection,
              }
            : null,
        },
        distribution: {
          programsByMajor: programByMajor.length,
          coursesByOrgUnit: courseByStatus.length,
        },
        workflows: workflowCounts,
        recent: {
          programs: serializePrograms,
          courses: serializeCourses,
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

