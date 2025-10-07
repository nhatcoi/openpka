import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ProgramStatus } from '@/constants/programs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await db.program.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const result = {
      pending: 0,
      reviewing: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      const count = stat._count.id;
      result.total += count;

      const status = (stat.status || '').toUpperCase() as ProgramStatus | string;

      switch (status) {
        case ProgramStatus.DRAFT:
        case ProgramStatus.SUBMITTED:
          result.pending += count;
          break;
        case ProgramStatus.REVIEWING:
          result.reviewing += count;
          break;
        case ProgramStatus.APPROVED:
        case ProgramStatus.PUBLISHED:
          result.approved += count;
          break;
        case ProgramStatus.REJECTED:
        case ProgramStatus.ARCHIVED:
          result.rejected += count;
          break;
        default:
          result.pending += count;
          break;
      }
    });

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
