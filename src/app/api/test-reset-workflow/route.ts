import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';

export async function POST(request: NextRequest) {
  try {
    const { workflowInstanceId } = await request.json();
    
    if (!workflowInstanceId) {
      return createErrorResponse('Missing workflowInstanceId', 'Workflow instance ID is required', 400);
    }

    const id = BigInt(workflowInstanceId);

    // Get current workflow instance
    const workflowInstance = await db.workflowInstance.findUnique({
      where: { id },
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
      where: { id },
      data: {
        status: 'PENDING',
        current_step: 1,
        completed_at: null,
        updated_at: new Date()
      }
    });

    // Delete all approval records for this workflow instance
    await db.approvalRecord.deleteMany({
      where: { workflow_instance_id: id }
    });

    return createSuccessResponse({
      message: 'Workflow instance reset successfully',
      workflow_instance: serializeIdsOnly(updatedInstance)
    });

  } catch (error) {
    console.error('Error resetting workflow instance:', error);
    return createErrorResponse(
      'Failed to reset workflow instance',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
