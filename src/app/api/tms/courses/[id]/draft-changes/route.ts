import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';

const academicWorkflowEngine = new AcademicWorkflowEngine();

// GET - Lấy danh sách draft changes (workflow instances với metadata)
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id } = await params;
    const courseId = BigInt(id);

    // Lấy workflow instances cho course changes
    const workflowInstances = await db.workflowInstance.findMany({
      where: { 
        entity_type: 'COURSE_CHANGE',
        entity_id: courseId
      },
      include: {
        workflow: {
          select: {
            workflow_name: true,
            description: true
          }
        },
        approval_records: {
          include: {
            approver: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return workflowInstances;
  },
  'fetch course draft changes'
);

// POST - Tạo draft change (workflow instance với metadata)
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { id } = await params;
    const courseId = BigInt(id);
    const body = await request.json();

    const {
      change_type,
      new_data,
      old_data,
      change_reason,
      change_notes
    } = body;

    // Kiểm tra course có tồn tại không
    const course = await db.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Tạo workflow instance với metadata chứa draft change data
    const workflowInstance = await academicWorkflowEngine.createWorkflow({
      entityType: 'COURSE_CHANGE',
      entityId: courseId,
      initiatedBy: BigInt(session.user.id),
      metadata: {
        course_id: courseId.toString(),
        change_type,
        old_data,
        new_data,
        change_reason,
        change_notes,
        status: 'DRAFT' // Draft status trong metadata
      }
    });

    return workflowInstance;
  },
  'create course draft change'
);