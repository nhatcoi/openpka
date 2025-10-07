import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/hr/positions - Get all job positions
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const positions = await db.jobPosition.findMany({
      orderBy: {
        code: 'asc',
      },
    });

    return positions;
  },
  'fetch job positions'
);
