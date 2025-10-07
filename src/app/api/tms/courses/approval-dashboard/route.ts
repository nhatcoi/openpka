import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createSuccessResponse, createErrorResponse, serializeIdsOnly } from '@/lib/api/api-handler';

// GET - Lấy danh sách draft changes cho approval dashboard
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Lấy tất cả workflow instances cho course changes
    const workflowInstances = await db.workflowInstance.findMany({
      where: {
        entity_type: 'COURSE_CHANGE',
        metadata: {
          path: ['status'],
          in: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED']
        }
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
  'fetch approval dashboard data'
);