import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const roles = await db.Role.findMany({
            include: {
                RolePermission: {
                    include: {
                        Permission: true
                    }
                },
                UserRole: {
                    include: {
                        users_user_role_user_idTousers: true,
                        users_user_role_assigned_byTousers: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedRoles = roles.map((role: { 
            id: bigint; 
            RolePermission?: Array<{
                id: bigint;
                role_id: bigint;
                permission_id: bigint;
                granted_by?: bigint;
                Permission?: { id: bigint; [key: string]: unknown };
                [key: string]: unknown;
            }>; 
            UserRole?: Array<{
                id: bigint;
                user_id: bigint;
                role_id: bigint;
                assigned_by?: bigint;
                users_user_role_user_idTousers?: { id: bigint; [key: string]: unknown };
                [key: string]: unknown;
            }>; 
            [key: string]: unknown 
        }) => ({
            ...role,
            id: role.id.toString(),
            RolePermission: role.RolePermission?.map((rp) => ({
                ...rp,
                id: rp.id.toString(),
                role_id: rp.role_id.toString(),
                permission_id: rp.permission_id.toString(),
                granted_by: rp.granted_by?.toString() || null,
                Permission: rp.Permission ? {
                    ...rp.Permission,
                    id: rp.Permission.id.toString()
                } : null
            })) || [],
            UserRole: role.UserRole?.map((ur) => ({
                ...ur,
                id: ur.id.toString(),
                user_id: ur.user_id.toString(),
                role_id: ur.role_id.toString(),
                assigned_by: ur.assigned_by?.toString() || null,
                users_user_role_user_idTousers: ur.users_user_role_user_idTousers ? {
                    ...ur.users_user_role_user_idTousers,
                    id: ur.users_user_role_user_idTousers.id.toString()
                } : null
            })) || []
        }));

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedRoles }, (key, value) =>
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
        const body = await request.json();
        const { name, description, is_system_role } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            );
        }

        const role = await db.Role.create({
            data: {
                name,
                description,
                is_system_role: is_system_role || false
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...role,
                id: role.id.toString()
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create role'
            },
            { status: 500 }
        );
    }
}