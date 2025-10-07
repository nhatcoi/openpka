import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getUserAccessibleUnits } from '@/lib/auth/hierarchical-permissions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Không có quyền');
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
    const include_children = searchParams.get('include_children') === 'true';
    const include_employees = searchParams.get('include_employees') === 'true';
    const include_parent = searchParams.get('include_parent') === 'true';
    
    // Lấy danh sách đơn vị user có quyền truy cập
    const accessibleUnits = await getUserAccessibleUnits(session.user.id);
    const accessibleUnitIds = accessibleUnits.map(unit => BigInt(unit.id));

    
    
    // Build where clause với hierarchical permission
    const where: Prisma.OrgUnitWhereInput = {
      id: { in: accessibleUnitIds } // Chỉ lấy đơn vị user có quyền
    };
    
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
    const data = body as Record<string, unknown>;
    const { name, code, description, type, status, parent_id } = data;
    
    if (!name || !code) {
      throw new Error('Name and code are required');
    }
    
    const newUnit = await db.orgUnit.create({
      data: {
        name: name as string,
        code: (code as string).toUpperCase(),
        description: description as string || null,
        type: type ? (type as string).toUpperCase() : null,
        status: status ? (status as string).toUpperCase() : null,
        parent_id: parent_id ? BigInt(parent_id as string) : null,
      } as any,
    });
    
    return newUnit;
  },
  'create org unit'
);