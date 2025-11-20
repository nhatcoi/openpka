import { NextRequest } from 'next/server';
import { withIdAndBody, serializeBigInt } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// PUT /api/org/units/[id]/status - Update org unit status only
export const PUT = withIdAndBody(
  async (id: string, body: unknown) => {
    const data = body as Record<string, unknown>;
    const { status } = data;
    
    // Validate required fields
    if (!status) {
      throw new Error('Status is required');
    }
    
    // Convert string id to BigInt
    const unitId = BigInt(id);
    
    // Check if unit exists
    const existingUnit = await db.orgUnit.findUnique({
      where: { id: unitId },
      select: { id: true, name: true, code: true }
    });
    
    if (!existingUnit) {
      throw new Error('Unit not found');
    }
    
    // Update only status field (auto uppercase)
    const updatedUnit = await db.orgUnit.update({
      where: { id: unitId },
      data: { status: (status as string)?.toUpperCase() }, // Auto uppercase status
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        updated_at: true,
      }
    });
    
    return updatedUnit;
  },
  'update org unit status'
);
