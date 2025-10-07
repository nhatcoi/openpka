import { NextRequest } from 'next/server';
import { withIdParam, withIdAndBody, serializeBigInt } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/unit-roles/[id] - Get org unit role by ID
export const GET = withIdParam(
  async (id: string) => {
    const roleId = BigInt(id);

    const role = await db.orgUnitRole.findUnique({
      where: { id: roleId },
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
    } as any);

    if (!role) {
      throw new Error('Unit role not found');
    }

    return role;
  },
  'fetch org unit role'
);

// PUT /api/org/unit-roles/[id] - Update org unit role
export const PUT = withIdAndBody(
  async (id: string, body: unknown) => {
    const roleId = BigInt(id);
    const data = body as Record<string, unknown>;
    const { note } = data;

    // Simple validation
    if (note === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    const updatedRole = await db.orgUnitRole.update({
      where: { id: roleId },
      data: {
        note: (note as string) || null,
      } as any
    });

    return updatedRole;
  },
  'update org unit role'
);

// DELETE /api/org/unit-roles/[id] - Delete org unit role
export const DELETE = withIdParam(
  async (id: string) => {
    const roleId = BigInt(id);

    const deletedRole = await db.orgUnitRole.delete({
      where: { id: roleId }
    });

    return deletedRole;
  },
  'delete org unit role'
);
