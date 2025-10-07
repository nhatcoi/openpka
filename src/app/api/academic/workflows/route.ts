import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

// GET /api/academic/workflows - Get academic workflow instances
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as 'COURSE' | 'PROGRAM' | 'MAJOR' | null;
    const status = searchParams.get('status');

    const workflows = await academicWorkflowEngine.getWorkflowInstances(
      entityType || undefined,
      status || undefined
    );

    return NextResponse.json({ data: workflows });
  } catch (error) {
    console.error('Error fetching academic workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/academic/workflows - Create new academic workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, metadata } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: entityType, entityId' },
        { status: 400 }
      );
    }

    const userId = BigInt(session.user.id);
    const instance = await academicWorkflowEngine.createWorkflow({
      entityType,
      entityId: BigInt(entityId),
      initiatedBy: userId,
      metadata
    });

    return NextResponse.json({ data: instance }, { status: 201 });
  } catch (error) {
    console.error('Error creating academic workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
