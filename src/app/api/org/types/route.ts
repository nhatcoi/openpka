import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/org/types
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    
    const whereClause: Prisma.OrgUnitTypeWhereInput = includeInactive ? {} : { is_active: true };

    const types = await db.orgUnitType.findMany({
      where: whereClause,
      orderBy: [
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    });

    return types;
  },
  'fetch org unit types'
);

// POST /api/org/types
export const POST = withBody(
  async (body: unknown) => {
    const data = body as Record<string, unknown>;
    const { code, name, description, color, sort_order } = data;

    // Simple validation
    if (!code || !name) {
      throw new Error('Code and name are required');
    }

    const newType = await db.orgUnitType.create({
      data: {
        code: (code as string).toUpperCase(),
        name: name as string,
        description: (description as string) || null,
        color: (color as string) || '#1976d2',
        sort_order: (sort_order as number) || 0,
        is_active: true
      }
    });

    return newType;
  },
  'create org unit type'
);