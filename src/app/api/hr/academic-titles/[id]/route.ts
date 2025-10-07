import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const titleId = resolvedParams.id;

        const title = await db.AcademicTitle.findUnique({
            where: { id: BigInt(titleId) },
        });

        if (!title) {
            return NextResponse.json({ success: false, error: 'Academic title not found' }, { status: 404 });
        }

        const serializedTitle = {
            ...title,
            id: title.id.toString(),
        };

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedTitle }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch academic title'
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
        const { code, title } = body;

        const updatedTitle = await db.AcademicTitle.update({
            where: { id: BigInt(titleId) },
            data: {
                code,
                title,
            },
        });

        const serializedTitle = {
            ...updatedTitle,
            id: updatedTitle.id.toString(),
        };

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedTitle }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update academic title'
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

        await db.AcademicTitle.delete({
            where: { id: BigInt(titleId) },
        });

        return NextResponse.json({ success: true, message: 'Academic title deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete academic title'
            },
            { status: 500 }
        );
    }
}
