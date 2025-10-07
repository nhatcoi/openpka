import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { serializeBigIntArray } from '@/utils/serialize';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to view evaluation periods
        if (!session.user.permissions?.includes('performance_review.read')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Get evaluation periods from performance_reviews
        const evaluationPeriods = await db.PerformanceReview.findMany({
            select: {
                review_period: true,
                created_at: true,
                updated_at: true
            },
            distinct: ['review_period'],
            orderBy: {
                created_at: 'desc'
            },
            skip: offset,
            take: limit
        });

        // Get count for each period
        const periodsWithCount = await Promise.all(
            evaluationPeriods.map(async (period) => {
                const count = await db.PerformanceReview.count({
                    where: { review_period: period.review_period }
                });
                return {
                    ...period,
                    _count: { id: count }
                };
            })
        );

        // Get total count
        const total = await db.PerformanceReview.groupBy({
            by: ['review_period'],
            _count: {
                review_period: true
            }
        });

        const serializedData = serializeBigIntArray(periodsWithCount);

        return NextResponse.json({
            data: serializedData,
            pagination: {
                page,
                limit,
                total: total.length,
                totalPages: Math.ceil(total.length / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching evaluation periods:', error);
        return NextResponse.json(
            { error: 'Failed to fetch evaluation periods' },
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

        // Check if user has permission to create evaluation periods
        if (!session.user.permissions?.includes('performance_review.create')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { period, description, startDate, endDate } = body;

        if (!period) {
            return NextResponse.json(
                { error: 'Period is required' },
                { status: 400 }
            );
        }

        // Check if period already exists
        const existingPeriod = await db.PerformanceReview.findFirst({
            where: { review_period: period }
        });

        if (existingPeriod) {
            return NextResponse.json(
                { error: 'Evaluation period already exists' },
                { status: 400 }
            );
        }

        // Get all lecturers
        const lecturers = await db.Employee.findMany({
            where: {
                employment_type: 'lecturer',
                status: 'ACTIVE'
            },
            include: {
                User: true
            }
        });

        // Create evaluation records for all lecturers
        const evaluationRecords = lecturers.map(lecturer => ({
            employee_id: lecturer.id,
            review_period: period,
            score: null,
            comments: null,
            created_at: new Date(),
            updated_at: new Date()
        }));

        // Insert evaluation records
        await db.PerformanceReview.createMany({
            data: evaluationRecords
        });

        return NextResponse.json({
            message: 'Evaluation period created successfully',
            period,
            lecturerCount: lecturers.length
        });

    } catch (error) {
        console.error('Error creating evaluation period:', error);
        return NextResponse.json(
            { error: 'Failed to create evaluation period' },
            { status: 500 }
        );
    }
}
