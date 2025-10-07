import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/unit-relations/[params] - Get org unit relation by composite key
export const GET = withErrorHandling(
  async (request: NextRequest, context?: any): Promise<any> => {
    if (!context?.params) throw new Error('Missing params');
    
    const resolvedParams = await context.params;
    // Parse composite key from params (format: parent_id/child_id/relation_type/effective_from)
    const [parent_id, child_id, relation_type, effective_from] = resolvedParams.params.split('/');
    
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Invalid parameters. Expected: parent_id/child_id/relation_type/effective_from');
    }

    // Parse date - handle both ISO string and date-only formats
    let parsedDate: Date;
    const dateStr = decodeURIComponent(effective_from);
    if (dateStr.includes('T')) {
      // ISO string format: 2020-01-01T00:00:00.000Z
      parsedDate = new Date(dateStr);
    } else {
      // Date-only format: 2020-01-01
      parsedDate = new Date(dateStr + 'T00:00:00.000Z');
    }

    const relation = await db.orgUnitRelation.findFirst({
      where: {
        parent_id: BigInt(parent_id),
        child_id: BigInt(child_id),
        relation_type: relation_type as any,
        effective_from: parsedDate,
      },
    });

    if (!relation) {
      throw new Error('Relation not found');
    }

    return relation;
  },
  'fetch org unit relation by params'
);

// PUT /api/org/unit-relations/[params] - Update org unit relation
export const PUT = withErrorHandling(
  async (request: NextRequest, context?: any): Promise<any> => {
    if (!context?.params) throw new Error('Missing params');
    
    const resolvedParams = await context.params;
    // Parse composite key from params
    const [parent_id, child_id, relation_type, effective_from] = resolvedParams.params.split('/');
    
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Invalid parameters. Expected: parent_id/child_id/relation_type/effective_from');
    }

    const body = await request.json();
    const { effective_to, description } = body;
    
    // Parse date - handle both ISO string and date-only formats
    let parsedDate: Date;
    const dateStr = decodeURIComponent(effective_from);
    if (dateStr.includes('T')) {
      // ISO string format: 2020-01-01T00:00:00.000Z
      parsedDate = new Date(dateStr);
    } else {
      // Date-only format: 2020-01-01
      parsedDate = new Date(dateStr + 'T00:00:00.000Z');
    }

    const updatedRelation = await db.orgUnitRelation.updateMany({
      where: {
        parent_id: BigInt(parent_id),
        child_id: BigInt(child_id),
        relation_type: relation_type as any,
        effective_from: parsedDate,
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
  'update org unit relation by params'
);

// DELETE /api/org/unit-relations/[params] - Delete org unit relation
export const DELETE = withErrorHandling(
  async (request: NextRequest, context?: any): Promise<any> => {
    if (!context?.params) throw new Error('Missing params');
    
    const resolvedParams = await context.params;
    // Parse composite key from params
    const [parent_id, child_id, relation_type, effective_from] = resolvedParams.params.split('/');
    
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Invalid parameters. Expected: parent_id/child_id/relation_type/effective_from');
    }

    console.log('DELETE params:', { parent_id, child_id, relation_type, effective_from });

    // Parse date - handle both ISO string and date-only formats
    let parsedDate: Date;
    const dateStr = decodeURIComponent(effective_from);
    if (dateStr.includes('T')) {
      // ISO string format: 2020-01-01T00:00:00.000Z
      parsedDate = new Date(dateStr);
    } else {
      // Date-only format: 2020-01-01
      parsedDate = new Date(dateStr + 'T00:00:00.000Z');
    }

    const deletedRelation = await db.orgUnitRelation.deleteMany({
      where: {
        parent_id: BigInt(parent_id),
        child_id: BigInt(child_id),
        relation_type: relation_type as any,
        effective_from: parsedDate,
      }
    });
    
    return deletedRelation.count === 0 
      ? { message: 'No relation found to delete', count: 0 }
      : { message: 'Relation deleted successfully', count: deletedRelation.count };
  },
  'delete org unit relation by params'
);

