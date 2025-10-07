import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { serializeBigInt } from '@/utils/serialize';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string  }> }
) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const evaluationId = resolvedParams.id;
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        // Get evaluation record
        const evaluation = await db.PerformanceReview.findUnique({
            where: {
                id: BigInt(evaluationId)
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        if (!evaluation) {
            return NextResponse.json(
                { error: 'Evaluation not found' },
                { status: 404 }
            );
        }

        // Check if user is the lecturer being evaluated or has admin permissions
        const isLecturer = evaluation.employees.user_id.toString() === session.user.id;
        const isAdmin = session.user.permissions?.includes('performance_review.read');

        if (!isLecturer && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const serializedData = serializeBigInt(evaluation);

        return NextResponse.json({
            data: serializedData
        });

    } catch (error) {
        console.error('Error fetching evaluation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch evaluation' },
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
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const evaluationId = resolvedParams.id;
        const body = await request.json();
        const { score, comments, evaluatorName, evaluatorEmail } = body;

        // Get evaluation record
        const evaluation = await db.PerformanceReview.findUnique({
            where: {
                id: BigInt(evaluationId)
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        if (!evaluation) {
            return NextResponse.json(
                { error: 'Evaluation not found' },
                { status: 404 }
            );
        }

        // Check if user has permission to update evaluation
        const isAdmin = session.user.permissions?.includes('performance_review.update');

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update evaluation
        const updatedEvaluation = await db.PerformanceReview.update({
            where: {
                id: BigInt(evaluationId)
            },
            data: {
                score: score ? parseFloat(score) : null,
                comments: comments || null,
                updated_at: new Date()
            },
            include: {
                Employee: {
                    include: {
                        User: true
                    }
                }
            }
        });

        const serializedData = serializeBigInt(updatedEvaluation);

        return NextResponse.json({
            message: 'Evaluation updated successfully',
            data: serializedData
        });

    } catch (error) {
        console.error('Error updating evaluation:', error);
        return NextResponse.json(
            { error: 'Failed to update evaluation' },
            { status: 500 }
        );
    }
}
