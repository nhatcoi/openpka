import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { serializeBigIntArray } from '@/utils/serialize';
import crypto from 'crypto';
import { requirePermission } from '@/lib/auth/api-permissions';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const canView =
            session.user.permissions?.includes('hr.performance_review.view') ||
            session.user.permissions?.includes('hr.performance_review.create');

        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');

        if (!period) {
            return NextResponse.json(
                { error: 'Period is required' },
                { status: 400 }
            );
        }

        // Get evaluation records for the period
        const evaluations = await db.PerformanceReview.findMany({
            where: {
                review_period: period
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            },
            orderBy: {
                Employee: {
                    User: {
                        full_name: 'asc'
                    }
                }
            }
        });

        // Generate evaluation URLs for each lecturer
        const evaluationUrls = evaluations.map(evaluation => {
            const evaluationId = evaluation.id.toString();
            const token = crypto.randomBytes(32).toString('hex');

            // Store token in comments field temporarily (in real app, use separate table)
            const evaluationUrl = `${process.env.NEXTAUTH_URL}/evaluation/${evaluationId}?token=${token}`;

            return {
                id: evaluation.id.toString(),
                employeeId: evaluation.employee_id.toString(),
                lecturerName: evaluation.employees.user.full_name,
                lecturerEmail: evaluation.employees.user.email,
                period: evaluation.review_period,
                evaluationUrl,
                token,
                createdAt: evaluation.created_at
            };
        });

        const serializedData = serializeBigIntArray(evaluationUrls);

        return NextResponse.json({
            data: serializedData,
            period,
            totalLecturers: evaluations.length
        });

    } catch (error) {
        console.error('Error generating evaluation URLs:', error);
        return NextResponse.json(
            { error: 'Failed to generate evaluation URLs' },
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

        requirePermission(session, 'hr.performance_review.create');

        const body = await request.json();
        const { period } = body;

        if (!period) {
            return NextResponse.json(
                { error: 'Period is required' },
                { status: 400 }
            );
        }

        // Get evaluation records for the period
        const evaluations = await db.PerformanceReview.findMany({
            where: {
                review_period: period
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        if (evaluations.length === 0) {
            return NextResponse.json(
                { error: 'No evaluations found for this period' },
                { status: 404 }
            );
        }

        // Generate evaluation URLs
        const evaluationUrls = evaluations.map(evaluation => {
            const evaluationId = evaluation.id.toString();
            const token = crypto.randomBytes(32).toString('hex');
            const evaluationUrl = `${process.env.NEXTAUTH_URL}/evaluation/${evaluationId}?token=${token}`;

            return {
                evaluationId,
                lecturerName: evaluation.employees.user.full_name,
                lecturerEmail: evaluation.employees.user.email,
                evaluationUrl,
                token
            };
        });

        return NextResponse.json({
            message: 'Evaluation URLs generated successfully',
            period,
            urls: evaluationUrls
        });

    } catch (error) {
        console.error('Error creating evaluation URLs:', error);
        return NextResponse.json(
            { error: 'Failed to create evaluation URLs' },
            { status: 500 }
        );
    }
}
