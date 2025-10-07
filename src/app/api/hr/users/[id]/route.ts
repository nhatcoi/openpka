import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        if (!session?.User?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { full_name, email, phone, address, dob, gender, new_password } = body;

        // Check if user exists
        const existingUser = await db.User.findUnique({
            where: { id: BigInt(resolvedParams.id) }
        });

        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: {
            full_name?: string;
            email?: string;
            phone?: string;
            address?: string;
            dob?: Date | null;
            gender?: string;
            password_hash?: string;
        } = {
            full_name,
            email,
            phone,
            address,
            dob: dob ? new Date(dob) : null,
            gender,
        };

        // Hash new password if provided
        if (new_password && new_password.trim() !== '') {
            updateData.password_hash = await bcrypt.hash(new_password, 12);
        }

        // Update user
        const updatedUser = await db.User.update({
            where: { id: BigInt(resolvedParams.id) },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                full_name: true,
                phone: true,
                address: true,
                dob: true,
                gender: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...updatedUser,
                id: updatedUser.id.toString()
            }
        });

    } catch (error) {
        console.error('Error updating User:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
