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

    // Validation
    if (!code && !name && description === undefined && !color && sort_order === undefined && is_active === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    // Check if type exists
    const existingType = await db.orgUnitType.findUnique({
      where: { id: typeId }
    });

    if (!existingType) {
      throw new Error('Type not found');
    }

    // Check for duplicate code if code is being updated
    if (code) {
      const codeUpper = (code as string).toUpperCase();
      if (codeUpper !== existingType.code) {
        const existingByCode = await db.orgUnitType.findUnique({
          where: { code: codeUpper }
        });

        if (existingByCode) {
          throw new Error(`Mã loại đơn vị "${codeUpper}" đã tồn tại, vui lòng nhập mã khác.`);
        }
      }
    }

    // Check for duplicate name if name is being updated
    if (name) {
      const nameStr = name as string;
      if (nameStr !== existingType.name) {
        const existingByName = await db.orgUnitType.findFirst({
          where: { name: nameStr }
        });

        if (existingByName) {
          throw new Error(`Tên loại đơn vị "${nameStr}" đã tồn tại, vui lòng nhập tên khác.`);
        }
      }
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

    // Check if type exists
    const existingType = await db.orgUnitType.findUnique({
      where: { id: typeId }
    });

    if (!existingType) {
      throw new Error('Type not found');
    }

    // Check if type is being used by any org units
    const unitsUsingType = await db.orgUnit.count({
      where: { type: existingType.code }
    });

    if (unitsUsingType > 0) {
      throw new Error(`Không thể xóa loại đơn vị vì đang được sử dụng bởi ${unitsUsingType} đơn vị. Vui lòng xử lý các đơn vị này trước.`);
    }

    // Soft delete (set is_active to false)
    const updatedType = await db.orgUnitType.update({
      where: { id: typeId },
      data: { is_active: false }
    });

    return updatedType;
  },
  'delete org unit type'
);
