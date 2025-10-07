import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/org/unit-relations - Get all org unit relations with pagination and filters
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Simple parameter processing
    const page = parseInt(params.page || '1');
    const size = parseInt(params.size || '20');
    const search = params.search || '';
    const parent_id = params.parent_id || '';
    const child_id = params.child_id || '';
    
    // Build where clause
    const where: Prisma.OrgUnitRelationWhereInput = {};
    
    if (parent_id) {
      where.parent_id = BigInt(parent_id);
    }
    
    if (child_id) {
      where.child_id = BigInt(child_id);
    }
    
    if (search) {
      where.OR = [
        { relation_type: { equals: search as any } },
        { note: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (page - 1) * size;
    
    // Execute queries
    const [relations, total] = await Promise.all([
      db.orgUnitRelation.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
      db.orgUnitRelation.count({ where }),
    ]);
    
    const result = {
      items: relations,
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
  'fetch org unit relations'
);

// POST /api/org/unit-relations - Create new org unit relation
export const POST = withBody(
  async (body: unknown) => {
    const data = body as Record<string, unknown>;
    const { parent_id, child_id, relation_type, effective_from, effective_to, description } = data;
    
    // Simple validation
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Missing required fields: parent_id, child_id, relation_type, effective_from');
    }
    
    const newRelation = await db.orgUnitRelation.create({
      data: {
        parent_id: BigInt(parent_id as string),
        child_id: BigInt(child_id as string),
        relation_type: relation_type as any,
        effective_from: new Date(effective_from as string),
        effective_to: effective_to ? new Date(effective_to as string) : null,
        note: (description as string) || null,
      }
    });
    
    return newRelation;
  },
  'create org unit relation'
);

