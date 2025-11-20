import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';
import { getToken } from 'next-auth/jwt';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            requirePermission(session, 'hr.rbac.view');
        }
        
        const resolvedParams = await params;
        const { id } = await params;
        const permissionId = BigInt(id);

        const permission = await db.Permission.findUnique({
            where: { id: BigInt(permissionId) },
            include: {
                role_permission: {
                    include: {
                        roles: true
                    }
                }
            }
        });

        if (!permission) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Permission not found'
                },
                { status: 404 }
            );
        }

        // Convert BigInt to string for JSON serialization
        const serializedPermission = {
            ...permission,
            id: permission.id.toString(),
            role_permission: permission.role_permission?.map((rp: { id: bigint; [key: string]: unknown }) => ({
                ...rp,
                id: rp.id.toString(),
                role_id: rp.role_id.toString(),
                permission_id: rp.permission_id.toString(),
                roles: rp.roles ? {
                    ...rp.roles,
                    id: rp.roles.id.toString()
                } : null
            })) || []
        };

        return NextResponse.json({ success: true, data: serializedPermission });
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

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permission
    requirePermission(session, 'hr.rbac.update');
    try {
        const resolvedParams = await params;
        const { id } = await params;
        const permissionId = BigInt(id);
        const body = await request.json();
        const { code, name } = body;

        // Get current user from token
        const token = await getToken({ req: request });
        const currentUserId = token?.sub ? BigInt(token.sub) : undefined;

        // Get old data for logging
        const oldPermission = await db.Permission.findUnique({
            where: { id: BigInt(permissionId) },
        });

        const permission = await db.Permission.update({
            where: { id: BigInt(permissionId) },
            data: {
                code,
                name
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedPermission = {
            ...permission,
            id: permission.id.toString()
        };

        // Log the update activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: currentUserId || BigInt(1),
            action: 'UPDATE',
            entity_type: 'permissions',
            entity_id: permission.id,
            old_value: oldPermission ? JSON.stringify({
                ...oldPermission,
                id: oldPermission.id.toString()
            }) : undefined,
            new_value: JSON.stringify(serializedPermission),
            actor_id: currentUserId,
            ...actorInfo,
        });

        return NextResponse.json({
            success: true,
            data: serializedPermission
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update permission'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = await params;
        const permissionId = BigInt(id);

        // Get current user from token
        const token = await getToken({ req: request });
        const currentUserId = token?.sub ? BigInt(token.sub) : undefined;

        // Get old data for logging
        const oldPermission = await db.Permission.findUnique({
            where: { id: BigInt(permissionId) },
        });

        await db.Permission.delete({
            where: { id: BigInt(permissionId) },
        });

        // Log the deletion activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: currentUserId || BigInt(1),
            action: 'DELETE',
            entity_type: 'permissions',
            entity_id: permissionId,
            old_value: oldPermission ? JSON.stringify({
                ...oldPermission,
                id: oldPermission.id.toString()
            }) : undefined,
            actor_id: currentUserId,
            ...actorInfo,
        });

        return NextResponse.json({
            success: true,
            message: 'Permission deleted successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete permission'
            },
            { status: 500 }
        );
    }
}
