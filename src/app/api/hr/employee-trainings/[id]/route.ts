import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const trainingId = resolvedParams.id;

        const employeeTraining = await db.Employee_training.findUnique({
            where: { id: BigInt(trainingId) },
            include: {
                employees: {
                    include: {
                        user: true,
                    },
                },
                trainings: true,
            },
        });

        if (!employeeTraining) {
            return NextResponse.json({ success: false, error: 'Employee training not found' }, { status: 404 });
        }

        const serializedTraining = {
            ...employeeTraining,
            id: employeeTraining.id.toString(),
            employee_id: employeeTraining.employee_id.toString(),
            training_id: employeeTraining.training_id.toString(),
            completion_date: employeeTraining.completion_date?.toISOString().split('T')[0] || null,
            created_at: employeeTraining.created_at.toISOString(),
            updated_at: employeeTraining.updated_at.toISOString(),
            employees: employeeTraining.employees ? {
                ...employeeTraining.employees,
                id: employeeTraining.employees.id.toString(),
                user_id: employeeTraining.employees.user_id?.toString() || null,
                user: employeeTraining.employees.user ? {
                    ...employeeTraining.employees.user,
                    id: employeeTraining.employees.user.id.toString(),
                } : null,
            } : null,
            trainings: employeeTraining.trainings ? {
                ...employeeTraining.trainings,
                id: employeeTraining.trainings.id.toString(),
                start_date: employeeTraining.trainings.start_date.toISOString().split('T')[0],
                end_date: employeeTraining.trainings.end_date.toISOString().split('T')[0],
                created_at: employeeTraining.trainings.created_at.toISOString(),
                updated_at: employeeTraining.trainings.updated_at.toISOString(),
            } : null,
        };

        return NextResponse.json({ success: true, data: serializedTraining });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch employee training'
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
        const trainingId = resolvedParams.id;
        const body = await request.json();
        const { employee_id, training_id, status, completion_date, certificate_url } = body;

        const updatedTraining = await db.Employee_training.update({
            where: { id: BigInt(trainingId) },
            data: {
                employee_id: employee_id ? BigInt(employee_id) : undefined,
                training_id: training_id ? BigInt(training_id) : undefined,
                status,
                completion_date: completion_date ? new Date(completion_date) : undefined,
                certificate_url,
            },
        });

        const serializedTraining = {
            ...updatedTraining,
            id: updatedTraining.id.toString(),
            employee_id: updatedTraining.employee_id.toString(),
            training_id: updatedTraining.training_id.toString(),
            completion_date: updatedTraining.completion_date?.toISOString().split('T')[0] || null,
            created_at: updatedTraining.created_at.toISOString(),
            updated_at: updatedTraining.updated_at.toISOString(),
        };

        return NextResponse.json({ success: true, data: serializedTraining });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update employee training'
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
        const trainingId = resolvedParams.id;

        await db.Employee_training.delete({
            where: { id: BigInt(trainingId) },
        });

        return NextResponse.json({ success: true, message: 'Employee training deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete employee training'
            },
            { status: 500 }
        );
    }
}
