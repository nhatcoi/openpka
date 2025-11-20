import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, withBody, validateSchema } from '@/lib/api/api-handler';
import { Schemas } from '@/lib/api/api-schemas';
import { Prisma } from '@prisma/client';

// GET /api/org/history
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const org_unit_id = searchParams.get('org_unit_id');
    const change_type = searchParams.get('change_type');
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '20');
    const sort = searchParams.get('sort') || 'changed_at';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc';

    if (!org_unit_id) {
      throw new Error('org_unit_id is required');
    }
    
    // Build where clause
    const where: Prisma.OrgUnitHistoryWhereInput = {
      org_unit_id: BigInt(org_unit_id),
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

    // Get data with pagination
    const [items, total] = await Promise.all([
      db.orgUnitHistory.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * size,
        take: size,
      }),
      db.orgUnitHistory.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  },
  'fetch history'
);

// POST /api/org/history
export const POST = withBody(
  async (body: unknown) => {
    // Validate input
    const validatedData = validateSchema(Schemas.History.Create, body);
    const { org_unit_id, old_name, new_name, change_type, details } = validatedData;

    // Create history record directly
    const result = await db.orgUnitHistory.create({
      data: {
        org_unit_id: BigInt(org_unit_id),
        old_name: old_name || undefined,
        new_name: new_name || undefined,
        change_type,
        details: details || undefined,
      },
    });
    
    return result;
  },
  'create history'
);
