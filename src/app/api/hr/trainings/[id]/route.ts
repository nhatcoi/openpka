import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const trainingId = resolvedParams.id;

        const training = await db.Training.findUnique({
            where: { id: BigInt(trainingId) },
        });

        if (!training) {
            return NextResponse.json({ success: false, error: 'Training not found' }, { status: 404 });
        }

        const serializedTraining = {
            ...training,
            id: training.id.toString(),
            start_date: training.start_date.toISOString().split('T')[0],
            end_date: training.end_date.toISOString().split('T')[0],
            created_at: training.created_at.toISOString(),
            updated_at: training.updated_at.toISOString(),
        };

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedTraining }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch training'
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
        const { title, provider, start_date, end_date, training_type, description } = body;

        const updatedTraining = await db.Training.update({
            where: { id: BigInt(trainingId) },
            data: {
                title,
                provider,
                start_date: start_date ? new Date(start_date) : undefined,
                end_date: end_date ? new Date(end_date) : undefined,
                training_type,
                description,
            },
        });

        const serializedTraining = {
            ...updatedTraining,
            id: updatedTraining.id.toString(),
            start_date: updatedTraining.start_date.toISOString().split('T')[0],
            end_date: updatedTraining.end_date.toISOString().split('T')[0],
            created_at: updatedTraining.created_at.toISOString(),
            updated_at: updatedTraining.updated_at.toISOString(),
        };

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedTraining }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update training'
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

        await db.Training.delete({
            where: { id: BigInt(trainingId) },
        });

        return NextResponse.json({ success: true, message: 'Training deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete training'
            },
            { status: 500 }
        );
    }
}
