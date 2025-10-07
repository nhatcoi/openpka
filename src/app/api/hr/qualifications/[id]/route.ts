import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Lấy thông tin bằng cấp theo ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const qualification = await db.Qualification.findUnique({
            where: {
                id: BigInt(resolvedParams.id)
            }
        });

        if (!qualification) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy bằng cấp' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...qualification,
                id: qualification.id.toString()
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

// PUT - Cập nhật bằng cấp
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const body = await request.json();
        const { code, title } = body;

        if (!code || !title) {
            return NextResponse.json(
                { success: false, error: 'Code và title là bắt buộc' },
                { status: 400 }
            );
        }

        const qualification = await db.Qualification.update({
            where: {
                id: BigInt(resolvedParams.id)
            },
            data: {
                code,
                title
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...qualification,
                id: qualification.id.toString()
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

// DELETE - Xóa bằng cấp
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
    DELETE
        // Kiểm tra xem có nhân viên nào đang sử dụng bằng cấp này không
        const employeeQualifications = await db.Employee_qualification.findMany({
            where: {
                qualification_id: BigInt(resolvedParams.id)
            }
        });

        if (employeeQualifications.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Không thể xóa bằng cấp này vì có ${employeeQualifications.length} nhân viên đang sử dụng`
                },
                { status: 400 }
            );
        }

        await db.Qualification.delete({
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
