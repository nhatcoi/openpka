import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employee_id');

        const employeeAcademicTitles = await db.EmployeeAcademicTitle.findMany({
            where: employeeId ? { employee_id: BigInt(employeeId) } : {},
            include: {
                Employee: {
                    include: {
                        User: true,
                    },
                },
                AcademicTitle: true,
            },
            orderBy: {
                awarded_date: 'desc',
            },
        });

        const serializedTitles = employeeAcademicTitles.map(item => ({
            ...item,
            id: item.id.toString(),
            employee_id: item.employee_id.toString(),
            academic_title_id: item.academic_title_id.toString(),
            awarded_date: item.awarded_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            Employee: item.Employee ? {
                ...item.Employee,
                id: item.Employee.id.toString(),
                user_id: item.Employee.user_id?.toString() || null,
                User: item.Employee.User ? {
                    ...item.Employee.User,
                    id: item.Employee.User.id.toString(),
                } : null,
            } : null,
            AcademicTitle: item.AcademicTitle ? {
                ...item.AcademicTitle,
                id: item.AcademicTitle.id.toString(),
            } : null,
        }));

        return NextResponse.json({ success: true, data: serializedTitles });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch employee academic titles'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employee_id, academic_title_id, awarded_date } = body;

        if (!employee_id || !academic_title_id || !awarded_date) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const newEmployeeAcademicTitle = await db.EmployeeAcademicTitle.create({
            data: {
                employee_id: BigInt(employee_id),
                academic_title_id: BigInt(academic_title_id),
                awarded_date: new Date(awarded_date),
            },
        });

        const serializedTitle = {
            ...newEmployeeAcademicTitle,
            id: newEmployeeAcademicTitle.id.toString(),
            employee_id: newEmployeeAcademicTitle.employee_id.toString(),
            academic_title_id: newEmployeeAcademicTitle.academic_title_id.toString(),
            awarded_date: newEmployeeAcademicTitle.awarded_date.toISOString().split('T')[0],
        };

        return NextResponse.json({ success: true, data: serializedTitle }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create employee academic title'
            },
            { status: 500 }
        );
    }
}
