import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Lấy thông tin bằng cấp nhân viên theo ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const employeeQualification = await db.Employee_qualification.findUnique({
            where: {
                id: BigInt(resolvedParams.id)
            },
            include: {
                employees: {
                    include: {
                        user: true
                    }
                },
                qualifications: true
            }
        });

        if (!employeeQualification) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy thông tin bằng cấp' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...employeeQualification,
                id: employeeQualification.id.toString(),
                employee_id: employeeQualification.employee_id.toString(),
                qualification_id: employeeQualification.qualification_id.toString(),
                employees: employeeQualification.employees ? {
                    ...employeeQualification.employees,
                    id: employeeQualification.employees.id.toString(),
                    user_id: employeeQualification.employees.user_id?.toString() || null,
                    user: employeeQualification.employees.user ? {
                        ...employeeQualification.employees.user,
                        id: employeeQualification.employees.user.id.toString()
                    } : null
                } : null,
                qualifications: employeeQualification.qualifications ? {
                    ...employeeQualification.qualifications,
                    id: employeeQualification.qualifications.id.toString()
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

// PUT - Cập nhật bằng cấp nhân viên
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const body = await request.json();
        const { qualification_id, major_field, institution, awarded_date } = body;

        if (!qualification_id || !major_field || !institution || !awarded_date) {
            return NextResponse.json(
                { success: false, error: 'Tất cả các trường là bắt buộc' },
                { status: 400 }
            );
        }

        const employeeQualification = await db.Employee_qualification.update({
            where: {
                id: BigInt(resolvedParams.id)
            },
            data: {
                qualification_id: BigInt(qualification_id),
                major_field,
                institution,
                awarded_date: new Date(awarded_date)
            },
            include: {
                employees: {
                    include: {
                        user: true
                    }
                },
                qualifications: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...employeeQualification,
                id: employeeQualification.id.toString(),
                employee_id: employeeQualification.employee_id.toString(),
                qualification_id: employeeQualification.qualification_id.toString(),
                employees: employeeQualification.employees ? {
                    ...employeeQualification.employees,
                    id: employeeQualification.employees.id.toString(),
                    user_id: employeeQualification.employees.user_id?.toString() || null,
                    user: employeeQualification.employees.user ? {
                        ...employeeQualification.employees.user,
                        id: employeeQualification.employees.user.id.toString()
                    } : null
                } : null,
                qualifications: employeeQualification.qualifications ? {
                    ...employeeQualification.qualifications,
                    id: employeeQualification.qualifications.id.toString()
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

// DELETE - Xóa bằng cấp nhân viên
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
    DELETE
        await db.Employee_qualification.delete({
            where: {
                id: BigInt(resolvedParams.id)
            }
        });

        return NextResponse.json({ success: true, message: 'Xóa bằng cấp thành công' });
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
