import { NextRequest } from 'next/server';
import { withIdParam, withIdAndBody, serializeBigInt } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/types/[id] - Get specific organization unit type
export const GET = withIdParam(
  async (id: string) => {
    const typeId = BigInt(id);

    const type = await db.orgUnitType.findUnique({
      where: { id: typeId }
    });

    if (!type) {
      throw new Error('Type not found');
    }

    return type;
  },
  'fetch org unit type'
);

// PUT /api/org/types/[id] - Update organization unit type
export const PUT = withIdAndBody(
  async (id: string, body: unknown) => {
    const typeId = BigInt(id);
    const data = body as Record<string, unknown>;
    const { code, name, description, color, sort_order, is_active } = data;

    // Simple validation
    if (!code && !name && description === undefined && !color && sort_order === undefined && is_active === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    // Update type
    const updateData: {
      code?: string;
      name?: string;
      description?: string | null;
      color?: string;
      sort_order?: number;
      is_active?: boolean;
    } = {};
    if (code) updateData.code = (code as string).toUpperCase();
    if (name) updateData.name = name as string;
    if (description !== undefined) updateData.description = description as string || null;
    if (color) updateData.color = color as string;
    if (sort_order !== undefined) updateData.sort_order = sort_order as number;
    if (is_active !== undefined) updateData.is_active = is_active as boolean;

    const updatedType = await db.orgUnitType.update({
      where: { id: typeId },
      data: updateData
    });

    return updatedType;
  },
  'update org unit type'
);

// DELETE /api/org/types/[id] - Soft delete organization unit type
export const DELETE = withIdParam(
  async (id: string) => {
    const typeId = BigInt(id);

    // Soft delete (set is_active to false)
    const updatedType = await db.orgUnitType.update({
      where: { id: typeId },
      data: { is_active: false }
    });

    return updatedType;
  },
  'delete org unit type'
);
