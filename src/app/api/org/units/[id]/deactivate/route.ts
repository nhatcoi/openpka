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
        actorId: actorInfo.actorId ?? undefined,
        actorName: actorInfo.actorName ?? undefined,
        userAgent: requestContext.userAgent || undefined,
        metadata: {
          org_unit_id: id,
          action: 'deactivate',
        },
      });

      const existingUnit = await tx.orgUnit.findUnique({
        where: { id: unitId },
        select: { id: true, status: true, name: true },
      });

      if (!existingUnit) {
        throw new Error('Unit not found');
      }

      // Check for active child units
      const activeChildUnitsCount = await tx.orgUnit.count({
        where: {
          parent_id: unitId,
          status: {
            in: [OrgUnitStatus.ACTIVE, OrgUnitStatus.APPROVED],
          },
        },
      });

      if (activeChildUnitsCount > 0) {
        throw new Error(
          `Không thể dừng hoạt động đơn vị "${existingUnit.name}" vì còn ${activeChildUnitsCount} đơn vị con đang hoạt động. Vui lòng xử lý các đơn vị con trước.`
        );
      }

      const deactivatedUnit = await tx.orgUnit.update({
        where: { id: unitId },
        data: {
          status: OrgUnitStatus.INACTIVE,
          updated_at: new Date(),
        },
      });

      return deactivatedUnit;
    });

    return result;
  },
  'deactivate org unit'
);

