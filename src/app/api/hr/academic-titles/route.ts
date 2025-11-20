import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        requirePermission(session, 'hr.academic_title.view');
    }
    try {
        const academicTitles = await db.AcademicTitle.findMany({
            orderBy: {
                title: 'asc',
            },
        });

        const serializedTitles = academicTitles.map(title => ({
            ...title,
            id: title.id.toString(),
        }));

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedTitles }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch academic titles'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Check permission
        requirePermission(session, 'hr.academic_title.create');
        
        const body = await request.json();
        const { code, title } = body;

        if (!code || !title) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const newTitle = await db.AcademicTitle.create({
            data: {
                code,
                title,
            },
        });

        const serializedTitle = {
            ...newTitle,
            id: newTitle.id.toString(),
        };

        return NextResponse.json({ success: true, data: serializedTitle }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create academic title'
            },
            { status: 500 }
        );
    }
}
