import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/org/unit-roles - Get all org unit roles with pagination and filters
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Simple parameter processing
    const page = parseInt(params.page || '1');
    const size = parseInt(params.size || '20');
    const search = params.search || '';
    const org_unit_id = params.org_unit_id || '';
    const role_id = params.role_id || '';
    
    // Build where clause
    const where: Prisma.OrgUnitRoleWhereInput = {};
    
    if (org_unit_id) {
      where.org_unit_id = BigInt(org_unit_id);
    }
    
    if (role_id) {
      (where as any).roleId = BigInt(role_id);
    }
    
    if (search) {
      where.OR = [
        { note: { contains: search, mode: 'insensitive' } } as any
      ];
    }
    
    const skip = (page - 1) * size;
    
    // Execute queries
    const [roles, total] = await Promise.all([
      db.orgUnitRole.findMany({
        where,
        include: {
          orgUnit: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
        } as any,
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      } as any),
      db.orgUnitRole.count({ where }),
    ]);
    
    const result = {
      items: roles,
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
  'fetch org unit roles'
);

// POST /api/org/unit-roles - Create new org unit role
export const POST = withBody(
  async (body: unknown) => {
    const data = body as Record<string, unknown>;
    const { org_unit_id, role_id, note } = data;
    
    // Simple validation
    if (!org_unit_id || !role_id) {
      throw new Error('Missing required fields: org_unit_id, role_id');
    }
    
    const newRole = await db.orgUnitRole.create({
      data: {
        org_unit_id: BigInt(org_unit_id as string),
        roleId: BigInt(role_id as string),
        note: (note as string) || null,
      } as any
    });
    
    return newRole;
  },
  'create org unit role'
);
