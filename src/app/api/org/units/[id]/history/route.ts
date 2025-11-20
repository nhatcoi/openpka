import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/org/units/[id]/history - Get history for a specific unit
export const GET = withErrorHandling(
  async (request: NextRequest, context?: { params?: Promise<{ id: string }> }) => {
    if (!context?.params) throw new Error('Missing params');

    const { id } = await context.params;
    const unitId = parseInt(id, 10);
    
    if (isNaN(unitId)) {
      throw new Error('Invalid unit ID');
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const change_type = searchParams.get('change_type') || undefined;
    const from_date = searchParams.get('from_date') || undefined;
    const to_date = searchParams.get('to_date') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '50');
    const sort = searchParams.get('sort') || 'changed_at';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc';
    
    // Build where clause
    const where: Prisma.OrgUnitHistoryWhereInput = {
      org_unit_id: unitId,
    };
    
    if (change_type) {
      where.change_type = change_type;
    }
    
    if (from_date || to_date) {
      where.changed_at = {};
      if (from_date) {
        where.changed_at.gte = new Date(from_date);
      }
      if (to_date) {
        where.changed_at.lte = new Date(to_date);
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * size;
    
    // Execute queries
    const [history, total] = await Promise.all([
      db.orgUnitHistory.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: size,
      }),
      db.orgUnitHistory.count({ where }),
    ]);
    
    const result = {
      items: history,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
        hasNextPage: page < Math.ceil(total / size),
        hasPrevPage: page > 1,
      },
    };
    
    return result;
  },
  'fetch unit history'
);
