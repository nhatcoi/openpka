import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';

const academicWorkflowEngine = new AcademicWorkflowEngine();

// POST - Approve draft change
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; workflowId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id, workflowId } = await params;
    const courseId = BigInt(id);
    const workflowInstanceId = BigInt(workflowId);
    const body = await request.json();

    const { comment } = body;

    // Lấy workflow instance
    const workflowInstance = await db.workflowInstance.findFirst({
      where: {
        id: workflowInstanceId,
        entity_type: 'COURSE_CHANGE',
        entity_id: courseId
      }
    });

    if (!workflowInstance) {
      throw new Error('Workflow instance not found');
    }

    // Kiểm tra status trong metadata
    const metadata = workflowInstance.metadata as any;
    if (metadata?.status !== 'PENDING_APPROVAL') {
      throw new Error('Draft change is not pending approval');
    }

    // Xử lý workflow action
    await academicWorkflowEngine.processAction(workflowInstanceId, {
      action: 'APPROVE',
      comments: comment || 'Approved draft change',
      approverId: BigInt(session.user.id)
    });

    // Cập nhật metadata
    const updatedMetadata = {
      ...metadata,
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
      approved_by: session.user.id,
      approval_comment: comment
    };

    const updatedInstance = await db.workflowInstance.update({
      where: { id: workflowInstanceId },
      data: {
        metadata: updatedMetadata
      }
    });

    // Áp dụng thay đổi vào course thật
    if (metadata.change_type === 'UPDATE' && metadata.new_data) {
      await db.course.update({
        where: { id: courseId },
        data: metadata.new_data
      });
    }

    return {
      workflow_instance: updatedInstance,
      message: 'Draft change approved and applied successfully'
    };
  },
  'approve draft change'
);

