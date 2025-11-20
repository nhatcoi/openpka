import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tms/majors/org-units
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    // Build where clause - prioritize FACULTY and SCHOOL for major management
    const where: any = {
      status: 'ACTIVE', // Only active org units
      type: {
        in: ['FACULTY', 'SCHOOL', 'DEPARTMENT'] // Only relevant types for major management
      }
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orgUnits = await db.orgUnit.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        parent_id: true,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ],
    });

    // Convert BigInt to string for JSON serialization
    const orgUnitsArray = orgUnits.map(unit => ({
      ...unit,
      id: unit.id.toString(),
      parent_id: unit.parent_id ? unit.parent_id.toString() : null,
    }));
    
    return NextResponse.json({
      success: true,
      data: orgUnitsArray
    });
  } catch (error) {
    console.error('Error fetching org units:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}