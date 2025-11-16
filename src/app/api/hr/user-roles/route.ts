import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        requirePermission(session, 'hr.rbac.view');
    }
    try {
        const userRoles = await db.UserRole.findMany({
            include: {
                Role: true,
                users_user_role_user_idTousers: true,
                users_user_role_assigned_byTousers: true
            },
            orderBy: {
                assigned_at: 'desc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedUserRoles = userRoles.map((userRole: {
            id: bigint;
            user_id: bigint;
            role_id: bigint;
            assigned_by?: bigint;
            Role?: { id: bigint; [key: string]: unknown };
            users_user_role_user_idTousers?: { id: bigint; [key: string]: unknown };
            users_user_role_assigned_byTousers?: { id: bigint; [key: string]: unknown };
            [key: string]: unknown;
        }) => ({
            ...userRole,
            id: userRole.id.toString(),
            user_id: userRole.user_id.toString(),
            role_id: userRole.role_id.toString(),
            assigned_by: userRole.assigned_by?.toString() || null,
            Role: userRole.Role ? {
                ...userRole.Role,
                id: userRole.Role.id.toString()
            } : null,
            users_user_role_user_idToUser: userRole.users_user_role_user_idTousers ? {
                ...userRole.users_user_role_user_idTousers,
                id: userRole.users_user_role_user_idTousers.id.toString()
            } : null,
            users_user_role_assigned_byToUser: userRole.users_user_role_assigned_byTousers ? {
                ...userRole.users_user_role_assigned_byTousers,
                id: userRole.users_user_role_assigned_byTousers.id.toString()
            } : null
        }));

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedUserRoles }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Database connection failed'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Check permission
        requirePermission(session, 'hr.rbac.create');
        
        const body = await request.json();
        const { user_id, role_id, assigned_by, expires_at, is_active } = body;

        if (!user_id || !role_id) {
            return NextResponse.json(
                { success: false, error: 'user_id and role_id are required' },
                { status: 400 }
            );
        }

        const userRole = await db.UserRole.create({
            data: {
                user_id: BigInt(user_id),
                role_id: BigInt(role_id),
                assigned_by: assigned_by ? BigInt(assigned_by) : null,
                expires_at: expires_at ? new Date(expires_at) : null,
                is_active: is_active !== undefined ? is_active : true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...userRole,
                id: userRole.id.toString(),
                user_id: userRole.user_id.toString(),
                role_id: userRole.role_id.toString(),
                assigned_by: userRole.assigned_by?.toString() || null
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create user role'
            },
            { status: 500 }
        );
    }
}