import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/org/units/audit - Get all units with their status for audit/monitoring
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '50');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc';

    // Build where clause
    const where: Prisma.OrgUnitWhereInput = {};
    
    if (status) {
      where.status = status.toUpperCase() as any;
    }
    
    if (type) {
      where.type = type.toUpperCase() as any;
    }

    // Calculate pagination
    const skip = (page - 1) * size;

    // Execute queries
    const [units, total, statusCounts] = await Promise.all([
      db.orgUnit.findMany({
        where,
        include: {},
        orderBy: { [sort]: order },
        skip,
        take: size,
      }),
      db.orgUnit.count({ where }),
      db.orgUnit.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
    ]);

    const result = {
      items: units,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
        hasNextPage: page < Math.ceil(total / size),
        hasPrevPage: page > 1,
      },
      statusCounts: statusCounts.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
    };

    return result;
  },
  'fetch org units audit data'
);
