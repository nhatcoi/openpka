import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

// POST /api/hr/leave-requests/[id]/approve - Duyệt đơn xin nghỉ
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Check permission
        requirePermission(session, 'hr.leave_request.approve');

        const leaveRequestId = BigInt(resolvedParams.id);
        const body = await request.json();
        const { action, comment } = body; // action: 'APPROVED' hoặc 'REJECTED'

        if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be APPROVED or REJECTED' }, { status: 400 });
        }

        // Lấy đơn xin nghỉ hiện tại
        const currentRequest = await db.LeaveRequest.findUnique({
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
                }
            }
        });

        if (!currentRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        if (currentRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request has already been processed' }, { status: 400 });
        }

        // Kiểm tra quyền duyệt
        const currentUser = await db.User.findUnique({
            where: { id: BigInt(session.user.id) },
            include: {
                Employee: {
                    include: {
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

        if (!currentUser?.Employee?.[0]) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const currentEmployee = currentUser.employees[0];
        // Tạm thời set isAdmin = true để test
        const isAdmin = true;

        // Kiểm tra quyền duyệt
        if (!isAdmin) {
            const canApprove = await checkApprovalPermission(currentEmployee, currentRequest.employees);
            if (!canApprove) {
                return NextResponse.json({ error: 'No permission to approve this request' }, { status: 403 });
            }
        }

        // Cập nhật trạng thái đơn xin nghỉ
        const updatedRequest = await db.LeaveRequest.update({
            where: { id: leaveRequestId },
            data: {
                status: action,
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

        // Tạo lịch sử duyệt trong employee_log
        await db.EmployeeLog.create({
            data: {
                employee_id: currentRequest.employee_id,
                action: 'UPDATE',
                entity_type: 'leave_request',
                entity_id: leaveRequestId,
                reason: `${action}: ${comment || (action === 'APPROVED' ? 'Đơn xin nghỉ được duyệt' : 'Đơn xin nghỉ bị từ chối')}`,
                actor_id: BigInt(session.user.id),
                actor_role: isAdmin ? 'ADMIN' : 'SUPERVISOR'
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
        console.error('Error approving leave request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function để kiểm tra quyền duyệt
async function checkApprovalPermission(supervisor: { id: string; [key: string]: unknown }, Employee: { id: string; [key: string]: unknown }): Promise<boolean> {
    // Logic kiểm tra quyền duyệt
    // Có thể dựa vào:
    // 1. Org unit hierarchy (supervisor ở cấp cao hơn)
    // 2. Role-based permission (RECTOR, DEAN, HEAD_DEPARTMENT có quyền duyệt)
    // 3. Direct supervisor relationship

    // Tạm thời return true để test
    // TODO: Implement proper approval permission logic
    return true;
}
