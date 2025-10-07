import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // Try direct user table access
        const users = await db.User.findMany({
            select: {
                id: true,
                full_name: true,
                email: true,
                created_at: true,
                updated_at: true,
            },
            orderBy: {
                full_name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: JSON.parse(JSON.stringify(users, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ))
        });
    } catch (error) {
        console.error('Error fetching User:', error);
        console.error('Error details:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to create users
        if (!session.user.permissions?.includes('user.create')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            username,
            full_name,
            email,
            password,
            dob,
            gender,
            phone,
            address
        } = body;

        // Validate required fields
        if (!username || !full_name || !email || !password) {
            return NextResponse.json(
                { error: 'Username, full_name, email, and password are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.User.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this username or email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await db.User.create({
            data: {
                username,
                full_name,
                email,
                password_hash: hashedPassword,
                status: 'ACTIVE',
                dob: dob ? new Date(dob) : null,
                gender,
                phone,
                address,
                created_at: new Date(),
                updated_at: new Date()
            },
            select: {
                id: true,
                username: true,
                full_name: true,
                email: true,
                status: true,
                created_at: true,
                updated_at: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                id: user.id.toString()
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating User:', error);
        return NextResponse.json(
            { error: 'Failed to create user', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to update users
        if (!session.user.permissions?.includes('user.update')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            id,
            username,
            full_name,
            email,
            password,
            dob,
            gender,
            phone,
            address,
            status
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.User.findUnique({
            where: { id: BigInt(id) }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: {
            username?: string;
            full_name?: string;
            email?: string;
            dob?: Date | null;
            gender?: string;
            phone?: string;
            address?: string;
            status?: string;
            updated_at: Date;
            password_hash?: string;
        } = {
            username,
            full_name,
            email,
            dob: dob ? new Date(dob) : null,
            gender,
            phone,
            address,
            status,
            updated_at: new Date()
        };

        // Only hash password if provided
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        // Update user
        const user = await db.User.update({
            where: { id: BigInt(id) },
            data: updateData,
            select: {
                id: true,
                username: true,
                full_name: true,
                email: true,
                status: true,
                created_at: true,
                updated_at: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...user,
                id: user.id.toString()
            }
        });

    } catch (error) {
        console.error('Error updating User:', error);
        return NextResponse.json(
            { error: 'Failed to update user', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to delete users
        if (!session.user.permissions?.includes('user.delete')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.User.findUnique({
            where: { id: BigInt(id) }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Delete user
        await db.User.delete({
            where: { id: BigInt(id) }
        });

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting User:', error);
        return NextResponse.json(
            { error: 'Failed to delete user', details: error.message },
            { status: 500 }
        );
    }
}