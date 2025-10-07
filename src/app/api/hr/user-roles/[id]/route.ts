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
        const userRoleId = BigInt(id);

        // Get current user from token
        const token = await getToken({ req: request });
        const currentUserId = token?.sub ? BigInt(token.sub) : undefined;

        // Get old data for logging
        const oldUserRole = await db.User_role.findUnique({
            where: { id: BigInt(userRoleId) },
            include: {
                users: true,
                roles: true
            }
        });

        await db.User_role.delete({
            where: { id: BigInt(userRoleId) },
        });

        // Log the deletion activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: currentUserId || BigInt(1),
            action: 'DELETE',
            entity_type: 'user_role',
            entity_id: userRoleId,
            old_value: oldUserRole ? JSON.stringify({
                ...oldUserRole,
                id: oldUserRole.id.toString(),
                user_id: oldUserRole.user_id.toString(),
                role_id: oldUserRole.role_id.toString(),
                users: oldUserRole.users ? {
                    ...oldUserRole.users,
                    id: oldUserRole.users.id.toString()
                } : null,
                roles: oldUserRole.roles ? {
                    ...oldUserRole.roles,
                    id: oldUserRole.roles.id.toString()
                } : null
            }) : undefined,
            actor_id: currentUserId,
            ...actorInfo,
        });

        return NextResponse.json({
            success: true,
            message: 'User role deleted successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete user role'
            },
            { status: 500 }
        );
    }
}
