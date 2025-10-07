import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET /api/tms/majors/org-units - Lấy danh sách org units cho majors
export async function GET() {
  try {
    const orgUnits = await prisma.orgUnit.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
      },
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: orgUnits.map(unit => ({
        id: Number(unit.id),
        name: unit.name,
        code: unit.code,
        type: unit.type,
      }))
    });

  } catch (error) {
    console.error('Error fetching org units:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch org units' },
      { status: 500 }
    );
  }
}
