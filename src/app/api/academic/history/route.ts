import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/academic/history
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Filters
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const action = searchParams.get('action');
    const actorId = searchParams.get('actor_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const search = searchParams.get('search');

    // Build where conditions
    const where: any = {};
    
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = BigInt(entityId);
    if (action) where.action = action;
    if (actorId) where.actor_id = BigInt(actorId);
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    // Fetch data from database using raw query
    let items, total;
    try {
      // Build WHERE clause for raw query
      let whereClause = '';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (entityType) {
        whereClause += ` AND entity_type = $${paramIndex}`;
        params.push(entityType);
        paramIndex++;
      }
      if (action) {
        whereClause += ` AND action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }
      if (entityId) {
        whereClause += ` AND entity_id = $${paramIndex}`;
        params.push(BigInt(entityId));
        paramIndex++;
      }
      if (actorId) {
        whereClause += ` AND actor_id = $${paramIndex}`;
        params.push(BigInt(actorId));
        paramIndex++;
      }
      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(new Date(startDate));
        paramIndex++;
      }
      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(new Date(endDate));
        paramIndex++;
      }
      if (search) {
        whereClause += ` AND (
          change_summary ILIKE $${paramIndex} OR 
          actor_name ILIKE $${paramIndex} OR
          field_name ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM academic.academic_history WHERE 1=1 ${whereClause}`;
      const countResult = await db.$queryRawUnsafe(countQuery, ...params);
      total = Number((countResult as any)[0]?.count || 0);
      
      // Get items
      const itemsQuery = `
        SELECT 
          id::text,
          entity_type,
          entity_id::text,
          action,
          field_name,
          old_value,
          new_value,
          change_summary,
          actor_id::text,
          actor_name,
          created_at
        FROM academic.academic_history 
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, skip);
      
      const itemsResult = await db.$queryRawUnsafe(itemsQuery, ...params);
      items = itemsResult as any[];
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return empty data if error
      items = [];
      total = 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get academic history',
    }, { status: 500 });
  }
};