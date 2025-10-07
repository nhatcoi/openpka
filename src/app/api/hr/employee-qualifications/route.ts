import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Lấy danh sách bằng cấp của nhân viên
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employee_id');

        let whereClause = {};
        if (employeeId) {
            whereClause = {
                employee_id: BigInt(employeeId)
            };
        }

        const employeeQualifications = await db.EmployeeQualification.findMany({
            where: whereClause,
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                },
                Qualification: true
            },
            orderBy: {
                awarded_date: 'desc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedData = employeeQualifications.map((eq: { id: bigint; [key: string]: unknown }) => ({
            ...eq,
            id: eq.id.toString(),
            employee_id: eq.employee_id.toString(),
            qualification_id: eq.qualification_id.toString(),
            Employee: eq.Employee ? {
                ...eq.Employee,
                id: eq.Employee.id.toString(),
                user_id: eq.Employee.user_id?.toString() || null,
                User: eq.Employee.User ? {
                    ...eq.Employee.User,
                    id: eq.Employee.User.id.toString()
                } : null
            } : null,
            Qualification: eq.Qualification ? {
                ...eq.Qualification,
                id: eq.Qualification.id.toString()
            } : null
        }));

        return NextResponse.json({ success: true, data: serializedData });
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

// POST - Thêm bằng cấp cho nhân viên
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employee_id, qualification_id, major_field, institution, awarded_date } = body;

        if (!employee_id || !qualification_id || !major_field || !institution || !awarded_date) {
            return NextResponse.json(
                { success: false, error: 'Tất cả các trường là bắt buộc' },
                { status: 400 }
            );
        }

        const employeeQualification = await db.EmployeeQualification.create({
            data: {
                employee_id: BigInt(employee_id),
                qualification_id: BigInt(qualification_id),
                major_field,
                institution,
                awarded_date: new Date(awarded_date)
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                },
                Qualification: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...employeeQualification,
                id: employeeQualification.id.toString(),
                employee_id: employeeQualification.employee_id.toString(),
                qualification_id: employeeQualification.qualification_id.toString(),
                Employee: employeeQualification.Employee ? {
                    ...employeeQualification.Employee,
                    id: employeeQualification.Employee.id.toString(),
                    user_id: employeeQualification.Employee.user_id?.toString() || null,
                    User: employeeQualification.Employee.User ? {
                        ...employeeQualification.Employee.User,
                        id: employeeQualification.Employee.User.id.toString()
                    } : null
                } : null,
                Qualification: employeeQualification.Qualification ? {
                    ...employeeQualification.Qualification,
                    id: employeeQualification.Qualification.id.toString()
                } : null
            }
        });
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
