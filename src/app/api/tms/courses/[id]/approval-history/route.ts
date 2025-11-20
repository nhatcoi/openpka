import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';
import { AcademicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { db } from '@/lib/db';

const engine = new AcademicWorkflowEngine();

// GET /api/tms/courses/[id]/approval-history
export const GET = withErrorHandling(async (_request: Request, ctx?: { params?: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  if (!ctx?.params) throw new Error('Missing params');
  const { id } = await ctx.params;
  const courseId = BigInt(id);

  const workflow = await engine.getWorkflowByEntity('COURSE', courseId);

  const rawRecords: any[] = Array.isArray((workflow as any)?.approval_records)
    ? ((workflow as any).approval_records as any[])
    : [];

  // Enrich approver details if missing
  const approverIds = Array.from(
    new Set(
      rawRecords
        .map((r) => r?.approver_id)
        .filter((v) => typeof v !== 'undefined' && v !== null)
        .map((v) => String(v))
    )
  );

  let idToUser = new Map<string, { id: bigint; full_name: string | null; email: string | null }>();
  if (approverIds.length > 0) {
    const users = await db.user.findMany({
      where: { id: { in: approverIds.map((id) => BigInt(id)) } },
      select: { id: true, full_name: true, email: true },
    });
    idToUser = new Map(users.map((u) => [String(u.id), u]));
  }

  // Ensure a stable, consistent shape for the frontend
  const records = rawRecords.map((r: any) => {
    const approver = r.approver
      ? {
          id: r.approver.id,
          full_name: r.approver.full_name,
          email: r.approver.email,
        }
      : ((): { id: bigint; full_name: string | null; email: string | null } | null => {
          const found = idToUser.get(String(r.approver_id));
          return found ? found : null;
        })();

    return {
      id: r.id,
      action: r.action,
      comments: r.comments ?? null,
      approved_at: r.approved_at ?? r.created_at,
      created_at: r.created_at,
      approver,
    };
  });

  return { items: records };
}, 'get course approval history');

