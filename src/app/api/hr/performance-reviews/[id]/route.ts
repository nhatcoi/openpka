import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const reviewId = resolvedParams.id;

        const performanceReview = await db.PerformanceReview.findUnique({
            where: { id: BigInt(reviewId) },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        if (!performanceReview) {
            return NextResponse.json({ success: false, error: 'Performance review not found' }, { status: 404 });
        }

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

        return NextResponse.json({ success: true, data: serializedReview });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch performance review'
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
        const reviewId = resolvedParams.id;
        const body = await request.json();
        const {
            review_period,
            score,
            comments,
        } = body;

        // Get old data for logging
        const oldReview = await db.PerformanceReview.findUnique({
            where: { id: BigInt(reviewId) },
        });

        const performanceReview = await db.PerformanceReview.update({
            where: { id: BigInt(reviewId) },
            data: {
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

        // Log the update activity
        const actorInfo = getActorInfo(request);
        await logEmployeeActivity({
            employee_id: performanceReview.employee_id,
            action: 'UPDATE',
            entity_type: 'performance_reviews',
            entity_id: performanceReview.id,
            old_value: oldReview ? JSON.stringify({
                ...oldReview,
                id: oldReview.id.toString(),
                employee_id: oldReview.employee_id.toString(),
                score: oldReview.score?.toString() || null,
            }) : undefined,
            new_value: JSON.stringify(serializedReview),
            ...actorInfo,
        });

        return NextResponse.json({ success: true, data: serializedReview });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update performance review'
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
        const reviewId = resolvedParams.id;

        // Get old data for logging
        const oldReview = await db.PerformanceReview.findUnique({
            where: { id: BigInt(reviewId) },
        });

        await db.PerformanceReview.delete({
            where: { id: BigInt(reviewId) }
        });

        // Log the deletion activity
        const actorInfo = getActorInfo(request);
        if (oldReview) {
            await logEmployeeActivity({
                employee_id: oldReview.employee_id,
                action: 'DELETE',
                entity_type: 'performance_reviews',
                entity_id: oldReview.id,
                old_value: JSON.stringify({
                    ...oldReview,
                    id: oldReview.id.toString(),
                    employee_id: oldReview.employee_id.toString(),
                    score: oldReview.score?.toString() || null,
                }),
                ...actorInfo,
            });
        }

        return NextResponse.json({ success: true, message: 'Performance review deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete performance review'
            },
            { status: 500 }
        );
    }
}
