import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employee_id');

        const employeeTrainings = await db.EmployeeTraining.findMany({
            where: employeeId ? { employee_id: BigInt(employeeId) } : {},
            include: {
                Employee: {
                    include: {
                        User: true,
                    },
                },
                Training: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        const serializedTrainings = employeeTrainings.map(item => ({
            ...item,
            id: item.id.toString(),
            employee_id: item.employee_id.toString(),
            training_id: item.training_id.toString(),
            completion_date: item.completion_date?.toISOString().split('T')[0] || null,
            created_at: item.created_at.toISOString(),
            updated_at: item.updated_at.toISOString(),
            Employee: item.Employee ? {
                ...item.Employee,
                id: item.Employee.id.toString(),
                user_id: item.Employee.user_id?.toString() || null,
                User: item.Employee.User ? {
                    ...item.Employee.User,
                    id: item.Employee.User.id.toString(),
                } : null,
            } : null,
            Training: item.Training ? {
                ...item.Training,
                id: item.Training.id.toString(),
                start_date: item.Training.start_date.toISOString().split('T')[0],
                end_date: item.Training.end_date.toISOString().split('T')[0],
                created_at: item.Training.created_at.toISOString(),
                updated_at: item.Training.updated_at.toISOString(),
            } : null,
        }));

        return NextResponse.json({ success: true, data: serializedTrainings });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch employee trainings'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employee_id, training_id, status, completion_date, certificate_url } = body;

        if (!employee_id || !training_id || !status) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const newEmployeeTraining = await db.EmployeeTraining.create({
            data: {
                employee_id: BigInt(employee_id),
                training_id: BigInt(training_id),
                status,
                completion_date: completion_date ? new Date(completion_date) : null,
                certificate_url,
            },
        });

        const serializedTraining = {
            ...newEmployeeTraining,
            id: newEmployeeTraining.id.toString(),
            employee_id: newEmployeeTraining.employee_id.toString(),
            training_id: newEmployeeTraining.training_id.toString(),
            completion_date: newEmployeeTraining.completion_date?.toISOString().split('T')[0] || null,
            created_at: newEmployeeTraining.created_at.toISOString(),
            updated_at: newEmployeeTraining.updated_at.toISOString(),
        };

        // Log the creation activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: BigInt(employee_id),
            action: 'CREATE',
            entity_type: 'employee_training',
            entity_id: newEmployeeTraining.id,
            new_value: JSON.stringify(serializedTraining),
            ...actorInfo,
        });

        return NextResponse.json({ success: true, data: serializedTraining }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create employee training'
            },
            { status: 500 }
        );
    }
}
