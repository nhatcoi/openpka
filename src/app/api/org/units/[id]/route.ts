import { NextRequest } from 'next/server';
import { withIdParam, withIdAndBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export const GET = withIdParam(
  async (id: string, request: Request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const unitId = BigInt(id);

    const unit = await db.orgUnit.findUnique({
      where: { id: unitId },
      include: {
        campus: {
          select: {
            id: true,
            name_vi: true,
            code: true,
          },
        },
      },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    return unit;
  },
  'fetch org unit'
);

export const PUT = withIdAndBody(
  async (id: string, body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userPermissions = session.user.permissions || [];
    const hasUpdatePermission = userPermissions.includes('org_unit.unit.update');
    
    if (!hasUpdatePermission) {
      throw new Error('Không có quyền cập nhật đơn vị này');
    }

    const unitId = BigInt(id);
    const data = body as Record<string, unknown>;
    const { name, code, description, type, status, parent_id } = data;
    
    if (!name || !code) {
      throw new Error('Name and code are required');
    }
    
    const updateData: {
      name?: string;
      code?: string;
      description?: string | null;
      type?: string | null;
      status?: string | null;
      parent_id?: bigint | null;
    } = {};
    
    if (name) updateData.name = name as string;
    if (code) updateData.code = (code as string).toUpperCase();
    if (description !== undefined) updateData.description = description as string || null;
    if (type !== undefined) updateData.type = type ? (type as string).toUpperCase() : null;
    if (status !== undefined) updateData.status = status ? (status as string).toUpperCase() : null;
    if (parent_id !== undefined) updateData.parent_id = parent_id ? BigInt(parent_id as string) : null;

    const updatedUnit = await db.orgUnit.update({
      where: { id: unitId },
      data: updateData as any,
    });

    return updatedUnit;
  },
  'update org unit'
);

export const DELETE = withIdParam(
  async (id: string) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const userPermissions = session.user.permissions || [];
    const hasDeletePermission = userPermissions.includes('org_unit.unit.delete');
    
    if (!hasDeletePermission) {
      throw new Error('Không có quyền xóa đơn vị này');
    }

    const unitId = BigInt(id);

    const result = await db.orgUnit.update({
      where: { id: unitId },
      data: {
        status: 'DELETED',
        updated_at: new Date()
      }
    });

    return result;
  },
  'delete org unit'
);