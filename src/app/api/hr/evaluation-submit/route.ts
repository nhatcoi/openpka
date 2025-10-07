import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializeBigInt } from '@/utils/serialize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationId, score, comments } = body;

    if (!evaluationId || !score) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

        // Update evaluation with submitted data
        const updatedEvaluation = await db.PerformanceReview.update({
            where: {
                id: BigInt(evaluationId)
            },
            data: {
                score: parseFloat(score),
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
            message: 'Evaluation submitted successfully',
            data: serializedData
        });

    } catch (error) {
        console.error('Error submitting evaluation:', error);
        return NextResponse.json(
            { error: 'Failed to submit evaluation' },
            { status: 500 }
        );
    }
}
