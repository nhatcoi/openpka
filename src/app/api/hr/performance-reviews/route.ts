import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId') || searchParams.get('employee_id');

        let whereClause = {};
        if (employeeId) {
            whereClause = { employee_id: BigInt(employeeId) };
        }

        const performanceReviews = await db.PerformanceReview.findMany({
            where: whereClause,
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        // Serialize BigInt and Decimal values
        const serializedReviews = performanceReviews.map((review: { id: bigint; [key: string]: unknown }) => ({
            ...review,
            id: review.id.toString(),
            employee_id: review.employee_id.toString(),
            score: review.score?.toString() || null,
            Employee: review.Employee ? {
                ...review.Employee,
                id: review.Employee.id.toString(),
                user_id: review.Employee.user_id.toString(),
                User: review.Employee.User ? {
                    ...review.Employee.User,
                    id: review.Employee.User.id.toString()
                } : null
            } : null
        }));

        return NextResponse.json({ success: true, data: serializedReviews });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch performance reviews'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            employee_id,
            review_period,
            score,
            comments,
        } = body;

        if (!employee_id) {
            return NextResponse.json({ success: false, error: 'Employee ID is required' }, { status: 400 });
        }

        const performanceReview = await db.PerformanceReview.create({
            data: {
                employee_id: BigInt(employee_id),
                review_period,
                score: score ? parseFloat(score) : null,
                comments,
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        // Serialize BigInt and Decimal values
        const serializedReview = {
            ...performanceReview,
            id: performanceReview.id.toString(),
            employee_id: performanceReview.employee_id.toString(),
            score: performanceReview.score?.toString() || null,
            Employee: performanceReview.Employee ? {
                ...performanceReview.Employee,
                id: performanceReview.Employee.id.toString(),
                user_id: performanceReview.Employee.user_id.toString(),
                User: performanceReview.Employee.User ? {
                    ...performanceReview.Employee.User,
                    id: performanceReview.Employee.User.id.toString()
                } : null
            } : null
        };

        // Log the creation activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: BigInt(employee_id),
            action: 'CREATE',
            entity_type: 'performance_reviews',
            entity_id: performanceReview.id,
            new_value: JSON.stringify(serializedReview),
            ...actorInfo,
        });

        return NextResponse.json({ success: true, data: serializedReview }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create performance review'
            },
            { status: 500 }
        );
    }
}
