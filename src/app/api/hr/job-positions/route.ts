import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';
import { Prisma } from '@prisma/client';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build where clause
    const where: Prisma.JobPositionWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { job_family: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobPositions = await db.jobPosition.findMany({
      where,
      orderBy: {
        title: 'asc',
      },
    });

    return jobPositions;
  },
  'fetch job positions'
);
