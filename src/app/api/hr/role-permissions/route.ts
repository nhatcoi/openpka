import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const rolePermissions = await db.RolePermission.findMany({
            include: {
                Role: true,
                Permission: true,
                User: true
            },
            orderBy: {
                granted_at: 'desc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedRolePermissions = rolePermissions.map((rolePermission: {
            id: bigint;
            role_id: bigint;
            permission_id: bigint;
            granted_by?: bigint;
            Role?: { id: bigint; [key: string]: unknown };
            Permission?: { id: bigint; [key: string]: unknown };
            User?: { id: bigint; [key: string]: unknown };
            [key: string]: unknown;
        }) => ({
            ...rolePermission,
            id: rolePermission.id.toString(),
            role_id: rolePermission.role_id.toString(),
            permission_id: rolePermission.permission_id.toString(),
            granted_by: rolePermission.granted_by?.toString() || null,
            Role: rolePermission.Role ? {
                ...rolePermission.Role,
                id: rolePermission.Role.id.toString()
            } : null,
            Permission: rolePermission.Permission ? {
                ...rolePermission.Permission,
                id: rolePermission.Permission.id.toString()
            } : null,
            User: rolePermission.User ? {
                ...rolePermission.User,
                id: rolePermission.User.id.toString()
            } : null
        }));

        return NextResponse.json({ success: true, data: serializedRolePermissions });
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
        const body = await request.json();
        const { role_id, permission_id, granted_by } = body;

        if (!role_id || !permission_id) {
            return NextResponse.json(
                { success: false, error: 'role_id and permission_id are required' },
                { status: 400 }
            );
        }

        const rolePermission = await db.RolePermission.create({
            data: {
                role_id: BigInt(role_id),
                permission_id: BigInt(permission_id),
                granted_by: granted_by ? BigInt(granted_by) : null
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...rolePermission,
                id: rolePermission.id.toString(),
                role_id: rolePermission.role_id.toString(),
                permission_id: rolePermission.permission_id.toString(),
                granted_by: rolePermission.granted_by?.toString() || null
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create role permission'
            },
            { status: 500 }
        );
    }
}