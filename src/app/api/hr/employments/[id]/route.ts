import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Lấy thông tin hợp đồng lao động theo ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const employment = await db.Employment.findUnique({
            where: {
                id: BigInt(resolvedParams.id)
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        if (!employment) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy hợp đồng lao động' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...employment,
                id: employment.id.toString(),
                employee_id: employment.employee_id.toString(),
                Employee: employment.employees ? {
                    ...employment.employees,
                    id: employment.employees.id.toString(),
                    user_id: employment.employees.user_id?.toString() || null,
                    User: employment.employees.user ? {
                        ...employment.employees.user,
                        id: employment.employees.user.id.toString()
                    } : null
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

// PUT - Cập nhật hợp đồng lao động
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const body = await request.json();
        const { contract_no, contract_type, start_date, end_date, fte, salary_band } = body;

        if (!contract_no || !contract_type || !start_date || !fte || !salary_band) {
            return NextResponse.json(
                { success: false, error: 'Tất cả các trường bắt buộc phải được điền' },
                { status: 400 }
            );
        }

        const employment = await db.Employment.update({
            where: {
                id: BigInt(resolvedParams.id)
            },
            data: {
                contract_no,
                contract_type,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : null,
                fte: parseFloat(fte),
                salary_band
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...employment,
                id: employment.id.toString(),
                employee_id: employment.employee_id.toString(),
                Employee: employment.employees ? {
                    ...employment.employees,
                    id: employment.employees.id.toString(),
                    user_id: employment.employees.user_id?.toString() || null,
                    User: employment.employees.user ? {
                        ...employment.employees.user,
                        id: employment.employees.user.id.toString()
                    } : null
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

// DELETE - Xóa hợp đồng lao động
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
    DELETE
        await db.Employment.delete({
            where: {
                id: BigInt(resolvedParams.id)
            }
        });

        return NextResponse.json({ success: true, message: 'Xóa hợp đồng lao động thành công' });
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
