import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const titleId = resolvedParams.id;

        const employeeAcademicTitle = await db.Employee_academic_title.findUnique({
            where: { id: BigInt(titleId) },
            include: {
                employees: {
                    include: {
                        user: true,
                    },
                },
                academic_titles: true,
            },
        });

        if (!employeeAcademicTitle) {
            return NextResponse.json({ success: false, error: 'Employee academic title not found' }, { status: 404 });
        }

        const serializedTitle = {
            ...employeeAcademicTitle,
            id: employeeAcademicTitle.id.toString(),
            employee_id: employeeAcademicTitle.employee_id.toString(),
            academic_title_id: employeeAcademicTitle.academic_title_id.toString(),
            awarded_date: employeeAcademicTitle.awarded_date.toISOString().split('T')[0],
            employees: employeeAcademicTitle.employees ? {
                ...employeeAcademicTitle.employees,
                id: employeeAcademicTitle.employees.id.toString(),
                user_id: employeeAcademicTitle.employees.user_id?.toString() || null,
                user: employeeAcademicTitle.employees.user ? {
                    ...employeeAcademicTitle.employees.user,
                    id: employeeAcademicTitle.employees.user.id.toString(),
                } : null,
            } : null,
            academic_titles: employeeAcademicTitle.academic_titles ? {
                ...employeeAcademicTitle.academic_titles,
                id: employeeAcademicTitle.academic_titles.id.toString(),
            } : null,
        };

        return NextResponse.json({ success: true, data: serializedTitle });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch employee academic title'
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const titleId = resolvedParams.id;
        const body = await request.json();
        const { employee_id, academic_title_id, awarded_date } = body;

        const updatedTitle = await db.Employee_academic_title.update({
            where: { id: BigInt(titleId) },
            data: {
                employee_id: employee_id ? BigInt(employee_id) : undefined,
                academic_title_id: academic_title_id ? BigInt(academic_title_id) : undefined,
                awarded_date: awarded_date ? new Date(awarded_date) : undefined,
            },
        });

        const serializedTitle = {
            ...updatedTitle,
            id: updatedTitle.id.toString(),
            employee_id: updatedTitle.employee_id.toString(),
            academic_title_id: updatedTitle.academic_title_id.toString(),
            awarded_date: updatedTitle.awarded_date.toISOString().split('T')[0],
        };

        return NextResponse.json({ success: true, data: serializedTitle });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update employee academic title'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const titleId = resolvedParams.id;

        await db.Employee_academic_title.delete({
            where: { id: BigInt(titleId) },
        });

        return NextResponse.json({ success: true, message: 'Employee academic title deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete employee academic title'
            },
            { status: 500 }
        );
    }
}
