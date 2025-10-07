import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
    try {
        const trainings = await db.Training.findMany({
            orderBy: {
                start_date: 'desc',
            },
        });

        const serializedTrainings = trainings.map(training => ({
            ...training,
            id: training.id.toString(),
            start_date: training.start_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            end_date: training.end_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            created_at: training.created_at.toISOString(),
            updated_at: training.updated_at.toISOString(),
        }));

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedTrainings }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch trainings'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, provider, start_date, end_date, training_type, description } = body;

        if (!title || !provider || !start_date || !end_date || !training_type) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const newTraining = await db.Training.create({
            data: {
                title,
                provider,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                training_type,
                description,
            },
        });

        const serializedTraining = {
            ...newTraining,
            id: newTraining.id.toString(),
            start_date: newTraining.start_date.toISOString().split('T')[0],
            end_date: newTraining.end_date.toISOString().split('T')[0],
            created_at: newTraining.created_at.toISOString(),
            updated_at: newTraining.updated_at.toISOString(),
        };

        // Log the creation activity (using a dummy employee_id since this is a training creation)
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: BigInt(1), // Dummy employee_id for system-level operations
            action: 'CREATE',
            entity_type: 'trainings',
            entity_id: newTraining.id,
            new_value: JSON.stringify(serializedTraining),
            ...actorInfo,
        });

        return NextResponse.json({ success: true, data: serializedTraining }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create training'
            },
            { status: 500 }
        );
    }
}
