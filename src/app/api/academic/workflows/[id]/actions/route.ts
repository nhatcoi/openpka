import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { db } from '@/lib/db';
import { serializeIdsOnly, createSuccessResponse, createErrorResponse } from '@/lib/api/api-handler';

// POST /api/academic/workflows/[id]/actions - Process academic workflow action
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', undefined, 401);
    }

    const instanceId = BigInt(params.id);
    const body = await request.json();
    const { action, comments, attachments } = body;

    if (!action) {
      return createErrorResponse('Missing required field: action', undefined, 400);
    }

    const userId = BigInt(session.user.id);
    const updatedInstance = await academicWorkflowEngine.processAction(instanceId, {
      action,
      comments,
      attachments,
      approverId: userId
    });

    // Sync entity status for COURSE based on workflow result
    try {
      // Fetch instance to get entity info if not included
      const instance = await db.workflowInstance.findUnique({ where: { id: updatedInstance.id } });
      if (instance?.entity_type === 'COURSE') {
        const courseId = instance.entity_id;
        const upperAction = String(action).toUpperCase();

        if (updatedInstance.status === 'COMPLETED' && upperAction === 'APPROVE') {
          await db.course.update({ where: { id: courseId }, data: { status: 'PUBLISHED' } });
        } else if (updatedInstance.status === 'REJECTED' || upperAction === 'REJECT') {
          await db.course.update({ where: { id: courseId }, data: { status: 'REJECTED' } });
        } else if (upperAction === 'RETURN') {
          await db.course.update({ where: { id: courseId }, data: { status: 'DRAFT' } });
        } else if (upperAction === 'APPROVE' && updatedInstance.status === 'IN_PROGRESS') {
          await db.course.update({ where: { id: courseId }, data: { status: 'APPROVED' } });
        }
      }
      if (instance?.entity_type === 'PROGRAM') {
        const programId = instance.entity_id;
        const upperAction = String(action).toUpperCase();
        if (updatedInstance.status === 'COMPLETED' && upperAction === 'APPROVE') {
          await db.program.update({ where: { id: programId }, data: { status: 'PUBLISHED' } });
        } else if (updatedInstance.status === 'REJECTED' || upperAction === 'REJECT') {
          await db.program.update({ where: { id: programId }, data: { status: 'REJECTED' } });
        } else if (upperAction === 'RETURN') {
          await db.program.update({ where: { id: programId }, data: { status: 'DRAFT' } });
        } else if (upperAction === 'APPROVE' && updatedInstance.status === 'IN_PROGRESS') {
          await db.program.update({ where: { id: programId }, data: { status: 'REVIEWING' } });
        }
      }
    } catch (syncErr) {
      console.warn('Failed to sync course status with workflow result:', syncErr);
    }

    // Use api-handler serialization
    const serializedInstance = serializeIdsOnly(updatedInstance);
    return createSuccessResponse(serializedInstance);
  } catch (error) {
    console.error('Error processing academic workflow action:', error);
    return createErrorResponse('Internal server error', error instanceof Error ? error.message : undefined, 500);
  }
}
