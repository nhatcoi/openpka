import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';

// GET /api/hr/leave-requests/[id] - Lấy chi tiết đơn xin nghỉ
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const leaveRequestId = BigInt(resolvedParams.id);

        const leaveRequest = await db.LeaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                Employee: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true
                            }
                        },
                        OrgAssignment: {
                            include: {
                                OrgUnit: true,
                                JobPosition: true
                            }
                        }
                    }
                },
            }
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Kiểm tra quyền xem
        const currentUser = await db.User.findUnique({
            where: { id: BigInt(session.user.id) },
            include: {
                Employee: true,
            }
        });

        if (!currentUser?.employees?.[0]) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const currentEmployee = currentUser.employees[0];
        // Tạm thời set isAdmin = true để test
        const isAdmin = true;

        // Kiểm tra quyền xem
        if (!isAdmin && leaveRequest.employee_id !== currentEmployee.id) {
            // TODO: Implement supervisor permission check
            return NextResponse.json({ error: 'No permission to view this request' }, { status: 403 });
        }

        // Serialize BigInt fields
        const serializedLeaveRequest = {
            ...leaveRequest,
            id: leaveRequest.id.toString(),
            employee_id: leaveRequest.employee_id.toString(),
            Employee: {
                ...leaveRequest.employees,
                id: leaveRequest.employees.id.toString(),
                user_id: leaveRequest.employees.user_id.toString(),
                User: {
                    ...leaveRequest.employees.user,
                    id: leaveRequest.employees.user.id.toString()
                },
                OrgAssignment: leaveRequest.employees.assignments.map(assignment => ({
                    ...assignment,
                    id: assignment.id.toString(),
                    employee_id: assignment.Employee_id.toString(),
                    org_unit_id: assignment.OrgUnit_id.toString(),
                    position_id: assignment.position_id.toString(),
                    OrgUnit: {
                        ...assignment.OrgUnits,
                        id: assignment.OrgUnits.id.toString()
                    },
                    JobPosition: {
                        ...assignment.job_positions,
                        id: assignment.job_positions.id.toString()
                    }
                }))
            }
        };

        return NextResponse.json(serializedLeaveRequest);

    } catch (error) {
        console.error('Error fetching leave request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/hr/leave-requests/[id] - Cập nhật đơn xin nghỉ
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const leaveRequestId = BigInt(resolvedParams.id);
        const body = await request.json();
        const { leave_type, start_date, end_date, reason } = body;

        // Lấy đơn xin nghỉ hiện tại
        const currentRequest = await db.LeaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                Employee: true
            }
        });

        if (!currentRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Kiểm tra quyền sửa
        const currentUser = await db.User.findUnique({
            where: { id: BigInt(session.user.id) },
            include: {
                Employee: true,
            }
        });

        if (!currentUser?.employees?.[0]) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const currentEmployee = currentUser.employees[0];
        // Tạm thời set isAdmin = true để test
        const isAdmin = true;

        // Chỉ cho phép sửa nếu là chủ đơn hoặc admin, và đơn chưa được duyệt
        if (!isAdmin && currentRequest.employee_id !== currentEmployee.id) {
            return NextResponse.json({ error: 'No permission to edit this request' }, { status: 403 });
        }

        if (currentRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Cannot edit approved/rejected request' }, { status: 400 });
        }

        // Validation
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);

            if (startDate >= endDate) {
                return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
            }
        }

        // Cập nhật đơn xin nghỉ
        const updatedRequest = await db.LeaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                ...(leave_type && { leave_type }),
                ...(start_date && { start_date: new Date(start_date) }),
                ...(end_date && { end_date: new Date(end_date) }),
                ...(reason !== undefined && { reason }),
                updated_at: new Date()
            },
            include: {
                Employee: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Tạo lịch sử trong employee_log
        await db.EmployeeLog.create({
            data: {
                employee_id: currentRequest.employee_id,
                action: 'UPDATE',
                entity_type: 'leave_request',
                entity_id: leaveRequestId,
                reason: 'Đơn xin nghỉ được cập nhật',
                actor_id: BigInt(session.user.id),
                actor_role: isAdmin ? 'ADMIN' : 'EMPLOYEE'
            }
        });

        // Serialize BigInt fields
        const serializedUpdatedRequest = {
            ...updatedRequest,
            id: updatedRequest.id.toString(),
            employee_id: updatedRequest.employee_id.toString(),
            Employee: {
                ...updatedRequest.employees,
                id: updatedRequest.employees.id.toString(),
                user_id: updatedRequest.employees.user_id.toString(),
                User: {
                    ...updatedRequest.employees.user,
                    id: updatedRequest.employees.user.id.toString()
                }
            }
        };

        return NextResponse.json(serializedUpdatedRequest);

    } catch (error) {
        console.error('Error updating leave request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/hr/leave-requests/[id] - Xóa đơn xin nghỉ
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const leaveRequestId = BigInt(resolvedParams.id);

        // Lấy đơn xin nghỉ hiện tại
        const currentRequest = await db.LeaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                Employee: true
            }
        });

        if (!currentRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Kiểm tra quyền xóa
        const currentUser = await db.User.findUnique({
            where: { id: BigInt(session.user.id) },
            include: {
                Employee: true,
            }
        });

        if (!currentUser?.employees?.[0]) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const currentEmployee = currentUser.employees[0];
        // Tạm thời set isAdmin = true để test
        const isAdmin = true;

        // Chỉ cho phép xóa nếu là chủ đơn hoặc admin, và đơn chưa được duyệt
        if (!isAdmin && currentRequest.employee_id !== currentEmployee.id) {
            return NextResponse.json({ error: 'No permission to delete this request' }, { status: 403 });
        }

        if (currentRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Cannot delete approved/rejected request' }, { status: 400 });
        }

        // Xóa đơn xin nghỉ (cascade sẽ xóa history)
        await db.LeaveRequest.delete({
            where: { id: leaveRequestId }
        });

        return NextResponse.json({ message: 'Leave request deleted successfully' });

    } catch (error) {
        console.error('Error deleting leave request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
