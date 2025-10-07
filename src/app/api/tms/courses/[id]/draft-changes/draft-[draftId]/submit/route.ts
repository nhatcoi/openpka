import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';

const academicWorkflowEngine = new AcademicWorkflowEngine();

// POST - Submit draft change (chuyển từ DRAFT sang PENDING_APPROVAL)
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; draftId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id, draftId } = await params;
    const courseId = BigInt(id);
    const workflowInstanceId = BigInt(draftId);

    // Kiểm tra workflow instance có tồn tại và thuộc về user không
    const workflowInstance = await db.workflowInstance.findFirst({
      where: {
        id: workflowInstanceId,
        entity_type: 'COURSE_CHANGE',
        entity_id: courseId,
        initiated_by: BigInt(session.user.id)
      }
    });

    if (!workflowInstance) {
      throw new Error('Workflow instance not found or not accessible');
    }

    // Kiểm tra status trong metadata
    const metadata = workflowInstance.metadata as any;
    if (metadata?.status !== 'DRAFT') {
      throw new Error('Draft change is not in DRAFT status');
    }

    // Cập nhật metadata để chuyển status từ DRAFT sang PENDING_APPROVAL
    const updatedMetadata = {
      ...metadata,
      status: 'PENDING_APPROVAL',
      submitted_at: new Date().toISOString()
    };

    const updatedInstance = await db.workflowInstance.update({
      where: { id: workflowInstanceId },
      data: {
        status: 'PENDING',
        metadata: updatedMetadata
      }
    });

    return {
      workflow_instance: updatedInstance,
      message: 'Draft change submitted for approval successfully'
    };
  },
  'submit draft change for approval'
);
