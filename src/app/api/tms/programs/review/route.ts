import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

// GET /api/tms/programs/review - List PROGRAM workflow instances with program info
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(parseInt(searchParams.get('limit') || '20', 10), 1);
  const skip = (page - 1) * limit;

  const where: any = { entity_type: 'PROGRAM' };
  if (status && status !== 'all') where.status = status;

  // Fetch instances with pagination
  const [totalCount, instances] = await Promise.all([
    db.workflowInstance.count({ where }),
    db.workflowInstance.findMany({
    where,
    include: {
      workflow: {
        include: { steps: true }
      },
      approval_records: {
        include: {
          approver: { select: { id: true, full_name: true, email: true } }
        },
        orderBy: { approved_at: 'desc' }
      }
      },
      orderBy: { initiated_at: 'desc' },
      skip,
      take: limit
    })
  ]);

  const programIds = instances.map(i => i.entity_id);
  const programs = await db.program.findMany({
    where: { id: { in: programIds } },
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      status: true,
      total_credits: true,
      version: true,
      org_unit_id: true
    }
  });
  const programById = new Map(programs.map(p => [p.id.toString(), p]));

  // Merge and apply client-side search filter (by program code/name)
  let items = instances.map(inst => ({
    workflow: {
      id: inst.id,
      status: inst.status,
      current_step: inst.current_step,
      initiated_at: inst.initiated_at,
      entity_type: inst.entity_type,
      entity_id: inst.entity_id,
      steps: inst.workflow.steps,
      approvals: inst.approval_records
    },
    program: programById.get(inst.entity_id.toString()) || null
  }));

  if (search) {
    const s = search.toLowerCase();
    items = items.filter(it => {
      const code = (it.program?.code || '').toLowerCase();
      const nameVi = (it.program?.name_vi || '').toLowerCase();
      const nameEn = (it.program?.name_en || '').toLowerCase();
      return code.includes(s) || nameVi.includes(s) || nameEn.includes(s);
    });
  }

  // Stats summary similar to course approval (basic counts by workflow status)
  const stats = {
    total: totalCount,
    pending: await db.workflowInstance.count({ where: { entity_type: 'PROGRAM', status: 'PENDING' } }),
    inProgress: await db.workflowInstance.count({ where: { entity_type: 'PROGRAM', status: 'IN_PROGRESS' } }),
    approved: await db.workflowInstance.count({ where: { entity_type: 'PROGRAM', status: 'APPROVED' } }),
    rejected: await db.workflowInstance.count({ where: { entity_type: 'PROGRAM', status: 'REJECTED' } }),
    completed: await db.workflowInstance.count({ where: { entity_type: 'PROGRAM', status: 'COMPLETED' } })
  };

  return {
    items,
    total: items.length,
    pagination: {
      page,
      limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    },
    stats
  };
}, 'list program workflows');


