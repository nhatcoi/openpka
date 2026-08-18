import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Đồng bộ OrgUnit.parent_id từ OrgUnitRelation
 * Tìm relation 'direct' active hiện tại và cập nhật OrgUnit.parent_id
 */
export async function syncParentIdFromRelations(
  childId: bigint,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || db;
  const now = new Date();
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Tìm relation 'direct' active hiện tại (effective_from <= now AND (effective_to IS NULL OR effective_to >= now))
  const activeDirectRelation = await client.orgUnitRelation.findFirst({
    where: {
      child_id: childId,
      relation_type: 'direct',
      effective_from: { lte: nowDate },
      OR: [
        { effective_to: null },
        { effective_to: { gte: nowDate } },
      ],
    },
    orderBy: { effective_from: 'desc' },
  });

  if (activeDirectRelation) {
    // Cập nhật OrgUnit.parent_id với parent_id từ relation active
    await client.orgUnit.update({
      where: { id: childId },
      data: { parent_id: activeDirectRelation.parent_id },
    });
  } else {
    // Không có relation active → Set parent_id = null
    await client.orgUnit.update({
      where: { id: childId },
      data: { parent_id: null },
    });
  }
}

/**
 * Đồng bộ OrgUnitRelation từ OrgUnit.parent_id
 * Tạo/cập nhật OrgUnitRelation với relation_type = 'direct' khi OrgUnit.parent_id thay đổi
 */
export async function syncRelationFromParentId(
  childId: bigint,
  parentId: bigint | null,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || db;
  const now = new Date();
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (parentId) {
    // Tìm relation 'direct' active hiện tại với parent_id này
    const existingRelation = await client.orgUnitRelation.findFirst({
      where: {
        child_id: childId,
        parent_id: parentId,
        relation_type: 'direct',
        effective_from: { lte: nowDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: nowDate } },
        ],
      },
    });

    if (!existingRelation) {
      // Kết thúc tất cả relations 'direct' active khác (nếu có)
      await client.orgUnitRelation.updateMany({
        where: {
          child_id: childId,
          relation_type: 'direct',
          parent_id: { not: parentId },
          effective_from: { lte: nowDate },
          OR: [
            { effective_to: null },
            { effective_to: { gte: nowDate } },
          ],
        },
        data: {
          effective_to: nowDate,
        },
      });

      // Tạo relation mới với relation_type = 'direct'
      await client.orgUnitRelation.create({
        data: {
          parent_id: parentId,
          child_id: childId,
          relation_type: 'direct',
          effective_from: nowDate,
          effective_to: null,
          note: 'Tự động tạo từ OrgUnit.parent_id',
        },
      });
    }
    // Nếu đã có relation active với parent_id này rồi thì không cần làm gì
  } else {
    // parent_id = null → Kết thúc tất cả relations 'direct' active
    await client.orgUnitRelation.updateMany({
      where: {
        child_id: childId,
        relation_type: 'direct',
        effective_from: { lte: nowDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: nowDate } },
        ],
      },
      data: {
        effective_to: nowDate,
      },
    });
  }
}

