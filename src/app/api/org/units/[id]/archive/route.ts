import { withIdParam } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { OrgUnitStatus } from '@/constants/org-units';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';

export const PATCH = withIdParam(
  async (id: string, request: Request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    try {
      requirePermission(session, 'org_unit.unit.update');
    } catch (error) {
      throw error;
    }

    const unitId = BigInt(id);
    const requestContext = getRequestContext(request);
    const actorInfo = await getActorInfo(session.user.id, db);

    const result = await db.$transaction(async (tx) => {
      await setHistoryContext(tx, {
        actorId: actorInfo.actorId,
        actorName: actorInfo.actorName,
        userAgent: requestContext.userAgent || undefined,
        metadata: {
          org_unit_id: id,
          action: 'archive',
        },
      });

      const existingUnit = await tx.orgUnit.findUnique({
        where: { id: unitId },
        select: { id: true, status: true },
      });

      if (!existingUnit) {
        throw new Error('Unit not found');
      }

      const archivedUnit = await tx.orgUnit.update({
        where: { id: unitId },
        data: {
          status: OrgUnitStatus.ARCHIVED,
          updated_at: new Date(),
        },
      });

      return archivedUnit;
    });

    return result;
  },
  'archive org unit'
);

