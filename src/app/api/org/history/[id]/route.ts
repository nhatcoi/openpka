import { NextRequest } from 'next/server';
import { withIdParam } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/history/[id]
export const GET = withIdParam(
  async (id: string) => {
    const historyId = parseInt(id, 10);
    
    if (isNaN(historyId)) {
      throw new Error('Invalid history ID');
    }
    
    // Find history record directly with Prisma
    const history = await db.orgUnitHistory.findUnique({
      where: { id: historyId },
    });
    
    if (!history) {
      throw new Error('History record not found');
    }
    
    return history;
  },
  'fetch history record'
);
