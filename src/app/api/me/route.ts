import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = BigInt(session.user.id);

        // Get user with roles, permissions, and employee info
        // @ts-ignore - Prisma client type issue
        const user = await db.User.findUnique({
            where: { id: userId },
            include: {
                Employee: {
                    include: {
                        OrgAssignment: {
                            include: {
                                OrgUnit: true
                            }
                        }
                    }
                },
                user_role_user_role_user_idTousers: {
                    where: {
                        expires_at: null, // Only active roles
                    },
                    include: {
                        Role: {
                            include: {
                                RolePermission: {
                                    include: {
                                        Permission: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Extract roles and permissions
        const roles = user.user_role_user_role_user_idTousers.map((ur: any) => ({
            id: ur.Role.id.toString(),
            name: ur.Role.name,
            description: ur.Role.description,
            assigned_at: ur.assigned_at,
        }));

        // Flatten permissions from all roles
        const permissions = user.user_role_user_role_user_idTousers.flatMap((ur: any) =>
            ur.Role.RolePermission.map((rp: any) => ({
                id: rp.Permission.id.toString(),
                name: rp.Permission.name,
                description: rp.Permission.description,
                resource: rp.Permission.resource,
                action: rp.Permission.action,
            }))
        );

        // Remove duplicate permissions
        const uniquePermissions = Array.from(
            new Map(permissions.map((p: any) => [p.name, p])).values()
        );

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id.toString(),
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone,
                    address: user.address,
                    dob: user.dob,
                    gender: user.gender,
                    status: user.status,
                    last_login_at: user.last_login_at,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                },
                roles,
                permissions: uniquePermissions,
                employee: user.Employee?.map((emp: any) => ({
                    id: emp.id.toString(),
                    user_id: emp.user_id.toString(),
                    employee_no: emp.employee_no,
                    employment_type: emp.employment_type,
                    status: emp.status,
                    hired_at: emp.hired_at,
                    terminated_at: emp.terminated_at,
                    org_assignments: emp.OrgAssignment?.map((oa: any) => ({
                        id: oa.id.toString(),
                        org_unit: oa.OrgUnit ? {
                            id: oa.OrgUnit.id.toString(),
                            name: oa.OrgUnit.name,
                            code: oa.OrgUnit.code,
                        } : null,
                    })) || [],
                })) || [],
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

