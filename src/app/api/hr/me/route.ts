import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user with employee info
        try {
            console.log('Session user ID:', session.user.id, 'Type:', typeof session.user.id);

            const user = await db.User.findUnique({
                where: { id: BigInt(session.user.id) },
                include: {
                    Employee: true
                }
            });

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: {
                    User: {
                        id: user.id.toString(),
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        phone: user.phone,
                        address: user.address,
                        dob: user.dob,
                        gender: user.gender,
                    },
                    Employee: user.Employee?.map(emp => ({
                        ...emp,
                        id: emp.id.toString(),
                        user_id: emp.user_id.toString(),
                    })) || []
                }
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { success: false, error: `Database error: ${dbError.message}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
