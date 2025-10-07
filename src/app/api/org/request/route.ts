import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const requestType = searchParams.get('request_type') || 'created';
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.OrgStructureRequestWhereInput = {
      request_type: requestType,
    };

    if (status) {
      whereClause.status = status;
    }

    // Fetch requests with related data
    const [requests, totalCount] = await Promise.all([
      db.orgStructureRequest.findMany({
        where: whereClause,
        include: {
          org_units: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      db.orgStructureRequest.count({
        where: whereClause,
      }),
    ]);

    const result = {
      items: requests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    return result;
  },
  'fetch organization requests'
);
