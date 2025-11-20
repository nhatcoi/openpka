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

    // Validation
    if (!code || !name) {
      throw new Error('Code and name are required');
    }

    const codeUpper = (code as string).toUpperCase();
    const nameStr = name as string;

    // Check for duplicate code
    const existingByCode = await db.orgUnitType.findUnique({
      where: { code: codeUpper }
    });

    if (existingByCode) {
      throw new Error(`Mã loại đơn vị "${codeUpper}" đã tồn tại, vui lòng nhập mã khác.`);
    }

    // Check for duplicate name
    const existingByName = await db.orgUnitType.findFirst({
      where: { name: nameStr }
    });

    if (existingByName) {
      throw new Error(`Tên loại đơn vị "${nameStr}" đã tồn tại, vui lòng nhập tên khác.`);
    }

    const newType = await db.orgUnitType.create({
      data: {
        code: codeUpper,
        name: nameStr,
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