import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { serializeBigIntArray } from '@/utils/serialize';

// GET /api/hr/employee-changes/history - Lấy lịch sử sửa đổi thông tin nhân viên
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employee_id');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entity_type');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Lấy thông tin user hiện tại
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

        const currentEmployee = currentUser.Employee[0];
        // Tạm thời set isAdmin = true để test
        const isAdmin = true;

        let whereClause: { [key: string]: unknown } = {};

        // Nếu không phải admin, chỉ xem được lịch sử của mình hoặc nhân viên trong đơn vị
        if (!isAdmin) {
            if (employeeId) {
                // Kiểm tra quyền xem lịch sử của nhân viên khác
                const targetEmployee = await db.Employee.findUnique({
                    where: { id: BigInt(employeeId) },
                    include: {
                        OrgAssignment: {
                            include: {
                                OrgUnit: true
                            }
                        }
                    }
                });

                if (!targetEmployee) {
                    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
                }

                // Kiểm tra xem có phải lịch sử của chính mình không
                if (targetEmployee.id !== currentEmployee.id) {
                    // TODO: Implement supervisor permission check
                    return NextResponse.json({ error: 'No permission to view this employee\'s history' }, { status: 403 });
                }

                whereClause.employee_id = BigInt(employeeId);
            } else {
                // Nếu không chỉ định employee_id, chỉ xem lịch sử của mình
                whereClause.employee_id = currentEmployee.id;
            }
        } else {
            // Admin có thể xem tất cả
            if (employeeId) {
                whereClause.employee_id = BigInt(employeeId);
            }
        }

        // Thêm các filter khác
        if (action) {
            whereClause.action = action;
        }

        if (entityType) {
            whereClause.entity_type = entityType;
        }

        if (startDate && endDate) {
            whereClause.created_at = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const [employeeLogs, total] = await Promise.all([
            db.EmployeeLog.findMany({
                where: whereClause,
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
                    User: {
                        select: {
                            id: true,
                            full_name: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip: offset,
                take: limit
            }),
            db.EmployeeLog.count({ where: whereClause })
        ]);

        // Serialize BigInt fields
        const serializedEmployeeLogs = serializeBigIntArray(employeeLogs);

        return NextResponse.json({
            data: serializedEmployeeLogs,
            pagination: {
                page,
                limit,
                total: Number(total),
                totalPages: Math.ceil(Number(total) / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching employee change history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
