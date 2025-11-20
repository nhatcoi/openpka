import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

// GET - Lấy danh sách tất cả bằng cấp
export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
        requirePermission(session, 'hr.qualification.view');
    }
    try {
        const qualifications = await db.Qualification.findMany({
            orderBy: {
                title: 'asc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedQualifications = qualifications.map((qualification: { id: bigint; [key: string]: unknown }) => ({
            ...qualification,
            id: qualification.id.toString()
        }));

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedQualifications }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
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

// POST - Tạo bằng cấp mới
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Check permission
        requirePermission(session, 'hr.qualification.create');
        
        const body = await request.json();
        const { code, title } = body;

        if (!code || !title) {
            return NextResponse.json(
                { success: false, error: 'Code và title là bắt buộc' },
                { status: 400 }
            );
        }

        const qualification = await db.Qualification.create({
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
