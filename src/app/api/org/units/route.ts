import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getUserAccessibleUnits } from '@/lib/auth/hierarchical-permissions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    // Check permission - view permission
    if (session?.user?.id) {
      requirePermission(session, 'org_unit.unit.view');
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const size = parseInt(searchParams.get('size') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') as 'asc' | 'desc' || 'desc';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const parent_id = searchParams.get('parent_id');
    const include_children = searchParams.get('include_children') === 'true';
    const include_employees = searchParams.get('include_employees') === 'true';
    const include_parent = searchParams.get('include_parent') === 'true';
    
    // Build where clause
    const where: Prisma.OrgUnitWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status as any;
    }
    
    if (type) {
      where.type = type as any;
    }
    
    if (parent_id) {
      where.parent_id = BigInt(parent_id);
    }
    
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) {
        where.created_at.gte = new Date(fromDate);
      }
      if (toDate) {
        where.created_at.lte = new Date(toDate);
      }
    }
    
    // Build include clause
    const include: Record<string, unknown> = {};
    
    if (include_parent) {
      include.parentRelations = {
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      };
    }
    
    if (include_children) {
      include.childRelations = {
        include: {
          child: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      };
    }
    
    if (include_employees) {
      include.OrgAssignment = {
        include: {
          Employee: {
            select: {
              id: true,
              employee_no: true,
              user_id: true,
            },
          },
        },
      };
    }
    
    const skip = (page - 1) * size;
    
    const [units, total] = await Promise.all([
      db.orgUnit.findMany({
        where,
        include,
        orderBy: { [sort]: order },
        skip,
        take: size,
      }),
      db.orgUnit.count({ where }),
    ]);
    
    const result = {
      items: units,
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
  'fetch org units'
);

export const POST = withBody(
  async (body: unknown) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Check permission using helper function
    requirePermission(session, 'org_unit.unit.create');

    const data = body as Record<string, unknown>;
    const { name, code, description, type, status, parent_id } = data;
    
    if (!name || !code) {
      throw new Error('Name and code are required');
    }

    const codeUpper = (code as string).toUpperCase();
    const nameStr = name as string;

    // Check for duplicate code (case-insensitive)
    const existingByCode = await db.orgUnit.findFirst({
      where: {
        code: codeUpper,
      },
    });

    if (existingByCode) {
      throw new Error(`Mã đơn vị "${codeUpper}" đã tồn tại, vui lòng nhập mã khác.`);
    }

    // Check for duplicate name
    const existingByName = await db.orgUnit.findFirst({
      where: {
        name: nameStr,
      },
    });

    if (existingByName) {
      throw new Error(`Tên đơn vị "${nameStr}" đã tồn tại, vui lòng nhập tên khác.`);
    }
    
    const parentIdBigInt = parent_id ? BigInt(parent_id as string) : null;

    const newUnit = await db.$transaction(async (tx) => {
      const unit = await tx.orgUnit.create({
        data: {
          name: nameStr,
          code: codeUpper,
          description: description as string || null,
          type: type ? (type as string).toUpperCase() : null,
          status: status ? (status as string).toUpperCase() : null,
          parent_id: parentIdBigInt,
        } as any,
      });

      // Đồng bộ OrgUnitRelation nếu có parent_id
      if (parentIdBigInt) {
        const { syncRelationFromParentId } = await import('@/lib/org/unit-relation-sync');
        await syncRelationFromParentId(unit.id, parentIdBigInt, tx);
      }

      return unit;
    });
    
    return newUnit;
  },
  'create org unit'
);