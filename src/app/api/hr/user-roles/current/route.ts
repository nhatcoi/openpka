import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = BigInt(session.user.id);

    const roles = await db.UserRole.findMany({
      where: { user_id: userId },
      include: {
        Role: {
          select: { id: true, name: true, description: true }
        }
      },
      orderBy: { assigned_at: 'desc' }
    });

    const data = roles.map(r => ({
      id: r.id.toString(),
      role: r.Role ? { id: r.Role.id.toString(), name: (r.Role as any).name, description: (r.Role as any).description } : null,
      is_active: r.is_active,
      assigned_at: r.assigned_at
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch current user roles:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


