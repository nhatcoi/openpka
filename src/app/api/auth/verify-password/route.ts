import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.User?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { current_password } = body;

        if (!current_password) {
            return NextResponse.json(
                { success: false, error: 'Current password is required' },
                { status: 400 }
            );
        }

        // Get user with password
        const user = await db.User.findUnique({
            where: { id: session.user.id },
            select: { password_hash: true }
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid current password' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password verified successfully'
        });

    } catch (error) {
        console.error('Error verifying password:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
