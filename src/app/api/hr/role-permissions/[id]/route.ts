import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';
import { getToken } from 'next-auth/jwt';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id } = await params;
        const rolePermissionId = BigInt(id);

        // Get current user from token
        const token = await getToken({ req: request });
        const currentUserId = token?.sub ? BigInt(token.sub) : undefined;

        // Get old data for logging
        const oldRolePermission = await db.Role_permission.findUnique({
            where: { id: BigInt(rolePermissionId) },
            include: {
                roles: true,
                permissions: true
            }
        });

        await db.Role_permission.delete({
            where: { id: BigInt(rolePermissionId) },
        });

        // Log the deletion activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: currentUserId || BigInt(1),
            action: 'DELETE',
            entity_type: 'role_permission',
            entity_id: rolePermissionId,
            old_value: oldRolePermission ? JSON.stringify({
                ...oldRolePermission,
                id: oldRolePermission.id.toString(),
                role_id: oldRolePermission.role_id.toString(),
                permission_id: oldRolePermission.permission_id.toString(),
                roles: oldRolePermission.roles ? {
                    ...oldRolePermission.roles,
                    id: oldRolePermission.roles.id.toString()
                } : null,
                permissions: oldRolePermission.permissions ? {
                    ...oldRolePermission.permissions,
                    id: oldRolePermission.permissions.id.toString()
                } : null
            }) : undefined,
            actor_id: currentUserId,
            ...actorInfo,
        });

        return NextResponse.json({
            success: true,
            message: 'Role permission deleted successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete role permission'
            },
            { status: 500 }
        );
    }
}
