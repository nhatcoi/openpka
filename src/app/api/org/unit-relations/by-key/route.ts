import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/unit-relations/by-key - Get org unit relation by composite key
export const GET = withErrorHandling(
  async (request: NextRequest): Promise<any> => {
    const { searchParams } = new URL(request.url);
    const parent_id = searchParams.get('parent_id');
    const child_id = searchParams.get('child_id');
    const relation_type = searchParams.get('relation_type');
    const effective_from = searchParams.get('effective_from');
    
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Missing required parameters: parent_id, child_id, relation_type, effective_from');
    }

    const relation = await db.orgUnitRelation.findFirst({
      where: {
        parent_id: BigInt(parent_id),
        child_id: BigInt(child_id),
        relation_type: relation_type as any,
        effective_from: new Date(effective_from),
      },
             include: {
               parent: {
                 select: {
                   id: true,
                   name: true,
                   code: true,
                   type: true,
                 },
               },
               child: {
                 select: {
                   id: true,
                   name: true,
                   code: true,
                   type: true,
                 },
               },
             } as Record<string, unknown>,
    });
    
    if (!relation) {
      throw new Error('Relation not found');
    }
    
    return relation;
  },
  'fetch org unit relation by key'
);

// PUT /api/org/unit-relations/by-key - Update org unit relation
export const PUT = withErrorHandling(
  async (request: NextRequest): Promise<any> => {
    const { searchParams } = new URL(request.url);
    const parent_id = searchParams.get('parent_id');
    const child_id = searchParams.get('child_id');
    const relation_type = searchParams.get('relation_type');
    const effective_from = searchParams.get('effective_from');
    
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Missing required parameters: parent_id, child_id, relation_type, effective_from');
    }

    const body = await request.json();
    const { effective_to, description } = body;
    
    const updatedRelation = await db.orgUnitRelation.updateMany({
      where: {
        parent_id: BigInt(parent_id),
        child_id: BigInt(child_id),
        relation_type: relation_type as any,
        effective_from: new Date(effective_from),
      },
      data: {
        effective_to: effective_to ? new Date(effective_to) : null,
        note: description || null,
      }
    });
    
    if (updatedRelation.count === 0) {
      throw new Error('Relation not found');
    }
    
    return { message: 'Relation updated successfully', count: updatedRelation.count };
  },
  'update org unit relation by key'
);

// DELETE /api/org/unit-relations/by-key - Delete org unit relation
export const DELETE = withErrorHandling(
  async (request: NextRequest): Promise<any> => {
    const { searchParams } = new URL(request.url);
    const parent_id = searchParams.get('parent_id');
    const child_id = searchParams.get('child_id');
    const relation_type = searchParams.get('relation_type');
    const effective_from = searchParams.get('effective_from');
    
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Missing required parameters: parent_id, child_id, relation_type, effective_from');
    }

    const deletedRelation = await db.orgUnitRelation.deleteMany({
      where: {
        parent_id: BigInt(parent_id),
        child_id: BigInt(child_id),
        relation_type: relation_type as any,
        effective_from: new Date(effective_from),
      }
    });
    
    return deletedRelation.count === 0
      ? { message: 'No relation found to delete', count: 0 }
      : { message: 'Relation deleted successfully', count: deletedRelation.count };
  },
  'delete org unit relation by key'
);

