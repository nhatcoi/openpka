import { NextRequest } from 'next/server';
import { withIdParam, withIdAndBody, serializeBigInt } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/structure-requests/[id] - Get single org structure request
export const GET = withIdParam(
  async (id: string) => {
    const requestId = parseInt(id, 10);
    
    if (isNaN(requestId)) {
      throw new Error('Invalid request ID');
    }
    
    const result = await db.orgStructureRequest.findUnique({
      where: { id: requestId },
      include: {
        org_units: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
    });
    
    if (!result) {
      throw new Error('Request not found');
    }
    
    return result;
  },
  'fetch org structure request'
);

// PUT /api/org/structure-requests/[id] - Update org structure request
export const PUT = withIdAndBody(
  async (id: string, body: unknown) => {
    const requestId = parseInt(id, 10);
    const data = body as Record<string, unknown>;
    
    if (isNaN(requestId)) {
      throw new Error('Invalid request ID');
    }
    
    // Check if request exists
    const existingRequest = await db.orgStructureRequest.findUnique({
      where: { id: requestId },
    });
    
    if (!existingRequest) {
      throw new Error('Request not found');
    }
    
    // Update request directly with Prisma
    const result = await db.orgStructureRequest.update({
      where: { id: requestId },
      data: {
        request_type: data.request_type as string,
        status: data.status as string,
        requester_id: data.requester_id ? BigInt(data.requester_id as string) : existingRequest.requester_id,
        target_org_unit_id: data.target_org_unit_id ? BigInt(data.target_org_unit_id as string) : existingRequest.target_org_unit_id,
        owner_org_id: data.owner_org_id ? BigInt(data.owner_org_id as string) : existingRequest.owner_org_id,
        payload: data.payload || existingRequest.payload,
        attachments: data.attachments ? JSON.stringify(data.attachments) : existingRequest.attachments,
        workflow_step: (data.workflow_step as number) || existingRequest.workflow_step,
        updated_at: new Date(),
      },
      include: {
        org_units: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
    });
    
    return result;
  },
  'update org structure request'
);

// DELETE /api/org/structure-requests/[id] - Delete org structure request
export const DELETE = withIdParam(
  async (id: string) => {
    const requestId = parseInt(id, 10);
    
    if (isNaN(requestId)) {
      throw new Error('Invalid request ID');
    }
    
    // Check if request exists
    const existingRequest = await db.orgStructureRequest.findUnique({
      where: { id: requestId },
    });
    
    if (!existingRequest) {
      throw new Error('Request not found');
    }
    
    // Delete request directly with Prisma
    await db.orgStructureRequest.delete({
      where: { id: requestId },
    });
    
    return { message: 'Request deleted successfully' };
  },
  'delete org structure request'
);