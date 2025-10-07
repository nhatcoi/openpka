import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

// GET /api/academic/workflows/dashboard - Get academic workflow dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboard = await academicWorkflowEngine.getDashboardData();

    return NextResponse.json({ data: dashboard });
  } catch (error) {
    console.error('Error fetching academic workflow dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
