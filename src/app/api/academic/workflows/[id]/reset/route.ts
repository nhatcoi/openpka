import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    const { id } = await params;
    const workflowInstanceId = BigInt(id);

    // Get current workflow instance
    const workflowInstance = await db.workflowInstance.findUnique({
      where: { id: workflowInstanceId },
      include: {
        workflow: {
          include: {
            steps: true
          }
        }
      }
    });

    if (!workflowInstance) {
      return createErrorResponse('Workflow instance not found', 'The specified workflow instance does not exist', 404);
    }

    // Reset workflow instance to PENDING status
    const updatedInstance = await db.workflowInstance.update({
      where: { id: workflowInstanceId },
      data: {
        status: 'PENDING',
        current_step: 1,
        completed_at: null,
        updated_at: new Date()
      }
    });

    // Delete all approval records for this workflow instance
    await db.approvalRecord.deleteMany({
      where: { workflow_instance_id: workflowInstanceId }
    });

    const responseData = serializeIdsOnly({
      message: 'Workflow instance reset successfully',
      workflow_instance: updatedInstance
    });
    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('Error resetting workflow instance:', error);
    return createErrorResponse(
      'Failed to reset workflow instance',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
