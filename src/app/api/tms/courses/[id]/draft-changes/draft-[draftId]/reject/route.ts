import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';

const academicWorkflowEngine = new AcademicWorkflowEngine();

// POST - Từ chối draft change
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; draftId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id, draftId } = await params;
    const courseId = BigInt(id);
    const draftChangeId = BigInt(draftId);
    const body = await request.json();

    const { comment } = body;

    if (!comment) {
      throw new Error('Rejection reason is required');
    }

    // Kiểm tra draft change có tồn tại và có thể reject không
    const draftChange = await db.courseDraftChange.findFirst({
      where: {
        id: draftChangeId,
        course_id: courseId,
        status: 'PENDING_APPROVAL'
      },
      include: {
        workflow_instance: true
      }
    });

    if (!draftChange) {
      throw new Error('Draft change not found or not rejectable');
    }

    // Kiểm tra quyền reject (có thể thêm logic kiểm tra role)
    // TODO: Implement role-based rejection logic

    // Xử lý workflow action
    if (draftChange.workflow_instance) {
      await academicWorkflowEngine.processAction(draftChange.workflow_instance.id, {
        action: 'REJECT',
        comments: comment,
        approverId: BigInt(session.user.id)
      });
    }

    // Cập nhật draft change status
    const updatedDraftChange = await db.courseDraftChange.update({
      where: { id: draftChangeId },
      data: {
        status: 'REJECTED',
        rejected_at: new Date()
      }
    });

    // Tạo comment
    await db.courseDraftChangeComment.create({
      data: {
        draft_change_id: draftChangeId,
        commenter_id: BigInt(session.user.id),
        comment,
        comment_type: 'REJECTION'
      }
    });

    return {
      draft_change: updatedDraftChange,
      message: 'Draft change rejected successfully'
    };
  },
  'reject draft change'
);

