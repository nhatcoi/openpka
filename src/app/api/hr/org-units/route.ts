import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session, 'hr.assignment.create');

    const units = await db.orgUnit.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const data = units.map((unit) => ({
      id: unit.id.toString(),
      name: unit.name || unit.code || `Đơn vị ${unit.id.toString()}`,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching HR org units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch org units' },
      { status: 500 }
    );
  }
}

