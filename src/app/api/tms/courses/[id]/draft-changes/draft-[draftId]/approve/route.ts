import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';

const academicWorkflowEngine = new AcademicWorkflowEngine();

// POST - Phê duyệt draft change
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

    // Kiểm tra draft change có tồn tại và có thể approve không
    const draftChange = await db.courseDraftChange.findFirst({
      where: {
        id: draftChangeId,
        course_id: courseId,
        status: 'PENDING_APPROVAL'
      },
      include: {
        course: true,
        workflow_instance: true
      }
    });

    if (!draftChange) {
      throw new Error('Draft change not found or not approvable');
    }

    // Kiểm tra quyền approve (có thể thêm logic kiểm tra role)
    // TODO: Implement role-based approval logic

    // Xử lý workflow action
    if (draftChange.workflow_instance) {
      await academicWorkflowEngine.processAction(draftChange.workflow_instance.id, {
        action: 'APPROVE',
        comments: comment || 'Approved draft change',
        approverId: BigInt(session.user.id)
      });
    }

    // Cập nhật draft change status
    const updatedDraftChange = await db.courseDraftChange.update({
      where: { id: draftChangeId },
      data: {
        status: 'APPROVED',
        approved_at: new Date()
      }
    });

    // Áp dụng thay đổi vào course thật
    if (draftChange.change_type === 'UPDATE') {
      await db.course.update({
        where: { id: courseId },
        data: draftChange.new_data as any
      });
    } else if (draftChange.change_type === 'DELETE') {
      await db.course.delete({
        where: { id: courseId }
      });
    }

    // Tạo comment
    if (comment) {
      await db.courseDraftChangeComment.create({
        data: {
          draft_change_id: draftChangeId,
          commenter_id: BigInt(session.user.id),
          comment,
          comment_type: 'APPROVAL'
        }
      });
    }

    return {
      draft_change: updatedDraftChange,
      message: 'Draft change approved and applied successfully'
    };
  },
  'approve draft change'
);

