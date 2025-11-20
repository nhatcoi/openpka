import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { syncParentIdFromRelations } from '@/lib/org/unit-relation-sync';

// GET /api/org/unit-relations - Get all org unit relations with pagination and filters
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const page = parseInt(params.page || '1');
    const size = parseInt(params.size || '20');
    const search = params.search || '';
    const parent_id = params.parent_id || '';
    const child_id = params.child_id || '';
    const sort = params.sort || 'effective_from';
    const order = params.order || 'desc';
    
    const where: Prisma.OrgUnitRelationWhereInput = {};
    
    if (parent_id) {
      where.parent_id = BigInt(parent_id);
    }
    
    if (child_id) {
      where.child_id = BigInt(child_id);
    }
    
    if (search) {
      where.OR = [
        { relation_type: { equals: search as any } },
        { note: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (page - 1) * size;
    
    const orderBy: Prisma.OrgUnitRelationOrderByWithRelationInput = {};
    const validSortFields = ['effective_from', 'effective_to', 'relation_type', 'created_at'];
    if (validSortFields.includes(sort)) {
      orderBy[sort as keyof Prisma.OrgUnitRelationOrderByWithRelationInput] = order as 'asc' | 'desc';
    } else {
      orderBy.effective_from = 'desc';
    }
    
    const [relations, total] = await Promise.all([
      db.orgUnitRelation.findMany({
        where,
        orderBy,
        skip,
        take: size,
      }),
      db.orgUnitRelation.count({ where }),
    ]);

    const parentIds = new Set<bigint>();
    const childIds = new Set<bigint>();
    relations.forEach(rel => {
      if (rel.parent_id) parentIds.add(rel.parent_id);
      if (rel.child_id) childIds.add(rel.child_id);
    });

    const unitIds = Array.from(new Set([...parentIds, ...childIds]));
    const units = unitIds.length > 0
      ? await db.orgUnit.findMany({
          where: { id: { in: unitIds } },
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            status: true,
          },
        })
      : [];

    const unitsMap = new Map(units.map(u => [u.id.toString(), u]));

    let enrichedRelations = relations.map(rel => ({
      ...rel,
      parent: rel.parent_id ? unitsMap.get(rel.parent_id.toString()) : undefined,
      child: rel.child_id ? unitsMap.get(rel.child_id.toString()) : undefined,
    }));

    if (sort === 'parent_name' || sort === 'child_name') {
      enrichedRelations = enrichedRelations.sort((a, b) => {
        const aName = sort === 'parent_name' 
          ? (a.parent?.name || '').toLowerCase()
          : (a.child?.name || '').toLowerCase();
        const bName = sort === 'parent_name'
          ? (b.parent?.name || '').toLowerCase()
          : (b.child?.name || '').toLowerCase();
        return order === 'asc' 
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      });
    }
    
    const result = {
      items: enrichedRelations,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
        hasNextPage: page < Math.ceil(total / size),
        hasPrevPage: page > 1,
      },
    };
    
    return result;
  },
  'fetch org unit relations'
);

// POST /api/org/unit-relations - Create new org unit relation
export const POST = withBody(
  async (body: unknown) => {
    const data = body as Record<string, unknown>;
    const { parent_id, child_id, relation_type, effective_from, effective_to, description } = data;
    
    // Simple validation
    if (!parent_id || !child_id || !relation_type || !effective_from) {
      throw new Error('Missing required fields: parent_id, child_id, relation_type, effective_from');
    }
    
    const parentIdBigInt = BigInt(parent_id as string);
    const childIdBigInt = BigInt(child_id as string);
    const effectiveFromDate = new Date(effective_from as string);
    const effectiveToDate = effective_to ? new Date(effective_to as string) : null;
    const now = new Date();
    
    // UC-1.7: Validation ràng buộc - 1 đơn vị con chỉ thuộc 1 cha
    // Check 1: Kiểm tra xem child_id đã có parent_id trực tiếp trong OrgUnit chưa
    const childUnit = await db.orgUnit.findUnique({
      where: { id: childIdBigInt },
      select: { id: true, parent_id: true, name: true },
    });
    
    if (childUnit?.parent_id && childUnit.parent_id !== parentIdBigInt) {
      const parentUnit = await db.orgUnit.findUnique({
        where: { id: childUnit.parent_id },
        select: { name: true },
      });
      throw new Error(
        `Đơn vị con "${childUnit.name}" đã thuộc về đơn vị cha "${parentUnit?.name || childUnit.parent_id.toString()}". Một đơn vị con chỉ có thể thuộc một đơn vị cha tại một thời điểm.`
      );
    }
    
    // Check 2: Kiểm tra xem child_id đã có relation active với parent_id khác chưa
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Tìm các relation active của child_id (effective_from <= now AND (effective_to IS NULL OR effective_to >= now))
    const activeRelations = await db.orgUnitRelation.findMany({
      where: {
        child_id: childIdBigInt,
        effective_from: { lte: nowDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: nowDate } },
        ],
      },
    });
    
    // Nếu có relation active với parent_id khác, throw error
    if (activeRelations.length > 0) {
      const conflictingRelation = activeRelations.find(rel => rel.parent_id !== parentIdBigInt);
      if (conflictingRelation) {
        const parentUnit = await db.orgUnit.findUnique({
          where: { id: conflictingRelation.parent_id },
          select: { name: true },
        });
        throw new Error(
          `Đơn vị con đã có quan hệ đang hoạt động với đơn vị cha "${parentUnit?.name || conflictingRelation.parent_id.toString()}". Một đơn vị con chỉ có thể thuộc một đơn vị cha tại một thời điểm.`
        );
      }
    }
    
    // Check 3: Nếu effective_from nằm trong khoảng thời gian của một relation active khác, throw error
    if (activeRelations.length > 0) {
      for (const relation of activeRelations) {
        if (relation.parent_id !== parentIdBigInt) {
          const relationEffectiveFrom = new Date(relation.effective_from);
          const relationEffectiveTo = relation.effective_to ? new Date(relation.effective_to) : null;
          
          // Kiểm tra overlap: effective_from của relation mới nằm trong khoảng thời gian của relation hiện có
          if (effectiveFromDate >= relationEffectiveFrom) {
            if (!relationEffectiveTo || effectiveFromDate <= relationEffectiveTo) {
              const parentUnit = await db.orgUnit.findUnique({
                where: { id: relation.parent_id },
                select: { name: true },
              });
              throw new Error(
                `Đơn vị con đã có quan hệ đang hoạt động với đơn vị cha "${parentUnit?.name || relation.parent_id.toString()}" trong khoảng thời gian này. Một đơn vị con chỉ có thể thuộc một đơn vị cha tại một thời điểm.`
              );
            }
          }
        }
      }
    }
    
    const newRelation = await db.$transaction(async (tx) => {
      const relation = await tx.orgUnitRelation.create({
        data: {
          parent_id: parentIdBigInt,
          child_id: childIdBigInt,
          relation_type: relation_type as any,
          effective_from: effectiveFromDate,
          effective_to: effectiveToDate,
          note: (description as string) || null,
        }
      });

      // Đồng bộ OrgUnit.parent_id nếu relation_type = 'direct' và đang active
      if (relation_type === 'direct') {
        const relationEffectiveFrom = new Date(relation.effective_from);
        const relationEffectiveTo = relation.effective_to ? new Date(relation.effective_to) : null;
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Nếu relation đang active (effective_from <= now AND (effective_to IS NULL OR effective_to >= now))
        if (relationEffectiveFrom <= nowDate && (!relationEffectiveTo || relationEffectiveTo >= nowDate)) {
          await syncParentIdFromRelations(childIdBigInt, tx);
        }
      }

      return relation;
    });
    
    return newRelation;
  },
  'create org unit relation'
);

