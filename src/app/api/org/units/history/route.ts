import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/org/units/history
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
        actor_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Get total count
    let total = 0;
    try {
      const countQuery = `SELECT COUNT(*) as count FROM org.org_unit_history WHERE 1=1 ${whereClause}`;
      const countResult = await db.$queryRawUnsafe(countQuery, ...params);
      total = Number((countResult as any)[0]?.count || 0);
    } catch (dbError) {
      console.error('Database count error:', dbError);
      total = 0;
    }
    
    // Get items
    let items: any[] = [];
    try {
      const itemsQuery = `
        SELECT 
          id::text,
          entity_type,
          entity_id::text,
          action,
          change_summary,
          change_details,
          actor_id::text,
          actor_name,
          user_agent,
          metadata,
          created_at
        FROM org.org_unit_history 
        WHERE 1=1 ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, skip);
      
      const itemsResult = await db.$queryRawUnsafe(itemsQuery, ...params);
      items = itemsResult as any[];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      items = [];
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
      error: 'Failed to get org unit history',
    }, { status: 500 });
  }
};

