import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';

const academicWorkflowEngine = new AcademicWorkflowEngine();

// GET - Lấy chi tiết draft change
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; draftId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id, draftId } = await params;
    const courseId = BigInt(id);
    const draftChangeId = BigInt(draftId);

    const draftChange = await db.courseDraftChange.findFirst({
      where: {
        id: draftChangeId,
        course_id: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name_vi: true,
            name_en: true,
            credits: true,
            type: true,
            status: true
          }
        },
        changed_by_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        workflow_instance: {
          select: {
            id: true,
            status: true,
            current_step: true,
            initiated_at: true,
            completed_at: true
          }
        },
        change_details: {
          orderBy: { created_at: 'asc' }
        },
        comments: {
          include: {
            commenter: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!draftChange) {
      throw new Error('Draft change not found');
    }

    return draftChange;
  },
  'fetch draft change details'
);

// PUT - Cập nhật draft change
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; draftId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id, draftId } = await params;
    const courseId = BigInt(id);
    const draftChangeId = BigInt(draftId);
    const body = await request.json();

    const {
      new_data,
      change_reason,
      change_notes,
      change_details
    } = body;

    // Kiểm tra draft change có tồn tại và thuộc về user hiện tại không
    const existingDraftChange = await db.courseDraftChange.findFirst({
      where: {
        id: draftChangeId,
        course_id: courseId,
        changed_by: BigInt(session.user.id),
        status: 'DRAFT'
      }
    });

    if (!existingDraftChange) {
      throw new Error('Draft change not found or not editable');
    }

    // Cập nhật draft change
    const updatedDraftChange = await db.courseDraftChange.update({
      where: { id: draftChangeId },
      data: {
        new_data,
        change_reason,
        change_notes,
        updated_at: new Date()
      }
    });

    // Cập nhật change details nếu có
    if (change_details && change_details.length > 0) {
      // Xóa details cũ
      await db.courseDraftChangeDetail.deleteMany({
        where: { draft_change_id: draftChangeId }
      });

      // Tạo details mới
      await db.courseDraftChangeDetail.createMany({
        data: change_details.map((detail: any) => ({
          draft_change_id: draftChangeId,
          field_name: detail.field_name,
          field_display_name: detail.field_display_name,
          old_value: detail.old_value,
          new_value: detail.new_value,
          change_type: detail.change_type
        }))
      });
    }

    return updatedDraftChange;
  },
  'update draft change'
);

// DELETE - Xóa draft change
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string; draftId: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id, draftId } = await params;
    const courseId = BigInt(id);
    const draftChangeId = BigInt(draftId);

    // Kiểm tra draft change có tồn tại và thuộc về user hiện tại không
    const existingDraftChange = await db.courseDraftChange.findFirst({
      where: {
        id: draftChangeId,
        course_id: courseId,
        changed_by: BigInt(session.user.id),
        status: 'DRAFT'
      }
    });

    if (!existingDraftChange) {
      throw new Error('Draft change not found or not deletable');
    }

    // Xóa draft change (cascade sẽ xóa details và comments)
    await db.courseDraftChange.delete({
      where: { id: draftChangeId }
    });

    return { message: 'Draft change deleted successfully' };
  },
  'delete draft change'
);

