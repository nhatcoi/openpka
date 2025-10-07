import {NextRequest, NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {logEmployeeActivity, getActorInfo} from '@/lib/audit-logger';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth/auth';
import {getToken} from 'next-auth/jwt';

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const {id} = await params;
        const employeeId = BigInt(id);

        const employee = await db.employee.findUnique({
            where: {id: employeeId as never},
            include: {
                User: true,
                OrgAssignment: {
                    include: {
                        OrgUnit: true,
                        JobPosition: true
                    }
                },
                Employment: {
                    orderBy: {
                        start_date: 'desc'
                    }
                }
            },
        });

        if (!employee) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Employee not found'
                },
                {status: 404}
            );
        }

        // Convert BigInt to string for JSON serialization
        const serializedEmployee = {
            ...employee,
            id: employee.id.toString(),
            user_id: employee.User_id?.toString() || null,
            User: employee.User ? {
                ...employee.User,
                id: employee.User.id.toString()
            } : null,
            OrgAssignment: employee.OrgAssignment?.map((assignment: { id: bigint; [key: string]: unknown }) => ({
                ...assignment,
                id: assignment.id.toString(),
                employee_id: assignment.employee_id.toString(),
                org_unit_id: assignment.org_unit_id.toString(),
                position_id: assignment.position_id?.toString() || null,
                allocation: assignment.allocation?.toString() || null,
                OrgUnit: assignment.OrgUnit ? {
                    ...assignment.OrgUnit,
                    id: assignment.OrgUnit.id.toString()
                } : null,
                JobPosition: assignment.JobPosition ? {
                    ...assignment.JobPosition,
                    id: assignment.JobPosition.id.toString()
                } : null
            })) || [],
            employments: employee.Employment?.map((employment: { id: bigint; [key: string]: unknown }) => ({
                ...employment,
                id: employment.id.toString(),
                employee_id: employment.employee_id.toString()
            })) || []
        };

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({success: true, data: serializedEmployee}, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        return new Response(jsonString, {
            headers: {'Content-Type': 'application/json'}
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Database connection failed'
            },
            {status: 500}
        );
    }
}

export async function PUT(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const {id} = await params;
        const employeeId = BigInt(id);
        const body = await request.json();
        const {
            user_id,
            employee_no,
            employment_type,
            status,
            hired_at,
            terminated_at,
        } = body;

        // Get current user from token
        const token = await getToken({req: request});
        const currentUserId = token?.sub ? BigInt(token.sub) : undefined;

        console.log('Token:', token);
        console.log('Current User ID:', currentUserId);

        // Get old data for logging
        const oldEmployee = await db.employee.findUnique({
            where: {id: employeeId as never},
        });

        const updateData: { [key: string]: unknown } = {
            employee_no,
            employment_type,
            status,
            hired_at: hired_at ? new Date(hired_at) : null,
            terminated_at: terminated_at ? new Date(terminated_at) : null,
        };

        // Only update user relation if user_id is provided
        if (user_id) {
            updateData.User = {connect: {id: BigInt(user_id)}};
        }

        const employee = await db.employee.update({
            where: {id: employeeId as never},
            data: updateData,
        });

        // Convert BigInt to string for JSON serialization
        const serializedEmployee = {
            ...employee,
            id: employee.id.toString(),
            user_id: employee.User_id?.toString() || null,
        };

        // Log the update activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: employee.id,
            action: 'UPDATE',
            entity_type: 'employees',
            entity_id: employee.id,
            old_value: oldEmployee ? JSON.stringify({
                ...oldEmployee,
                id: oldEmployee.id.toString(),
                user_id: oldEmployee.user_id?.toString() || null,
            }) : undefined,
            new_value: JSON.stringify(serializedEmployee),
            actor_id: currentUserId,
            ...actorInfo,
        });

        return NextResponse.json({
            success: true,
            data: serializedEmployee
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update employee'
            },
            {status: 500}
        );
    }
}

export async function DELETE(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const {id} = await params;
        const employeeId = BigInt(id);

        // Get current user from token
        const token = await getToken({req: request});
        const currentUserId = token?.sub ? BigInt(token.sub) : undefined;

        // Get old data for logging
        const oldEmployee = await db.employee.findUnique({
            where: {
                id: employeeId as
                    never

            },
        });

        await db.employee.delete({
            where: {
                id: employeeId as
                    never

            },
        });

        // Log the deletion activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: employeeId,
            action: 'DELETE',
            entity_type: 'employees',
            entity_id: employeeId,
            old_value: oldEmployee ? JSON.stringify({
                ...oldEmployee,
                id: oldEmployee.id.toString(),
                user_id: oldEmployee.user_id?.toString() || null,
            }) : undefined,
            actor_id: currentUserId,
            ...actorInfo,
        });

        return NextResponse.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete employee'
            },
            {status: 500}
        );
    }
}