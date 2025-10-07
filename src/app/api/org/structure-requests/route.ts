import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/org-structure-requests - Get all org structure requests with pagination and filters
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Simple parameter processing
    const page = parseInt(params.page || '1');
    const size = parseInt(params.size || '20');
    const search = params.search || '';
    const request_type = params.request_type || undefined;
    const status = params.status || undefined;
    
    // Build where clause
    const where: Prisma.OrgStructureRequestWhereInput = {};
    
    if (request_type) {
      where.request_type = request_type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { payload: { path: ['name'], string_contains: search } },
        { payload: { path: ['code'], string_contains: search } },
      ];
    }
    
    const skip = (page - 1) * size;
    
    // Execute queries
    const [requests, total] = await Promise.all([
      db.orgStructureRequest.findMany({
        where,
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
        orderBy: { created_at: 'desc' },
        skip,
        take: size,
      }),
      db.orgStructureRequest.count({ where }),
    ]);
    
    const result = {
      items: requests,
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
  'fetch org structure requests'
);

// POST /api/org-structure-requests - Create new org structure request
export const POST = withBody(
  async (body: unknown) => {
    const data = body as Record<string, unknown>;
    
    // Simple validation - request_type is required
    if (!data.request_type) {
      throw new Error('request_type is required');
    }
    
    // Create structure request directly with Prisma
    const result = await db.orgStructureRequest.create({
      data: {
        request_type: data.request_type as string,
        status: (data.status as string) || 'SUBMITTED',
        requester_id: data.requester_id ? BigInt(data.requester_id as string) : null,
        target_org_unit_id: data.target_org_unit_id ? BigInt(data.target_org_unit_id as string) : null,
        owner_org_id: data.owner_org_id ? BigInt(data.owner_org_id as string) : null,
        payload: data.payload || {},
        attachments: data.attachments ? JSON.stringify(data.attachments) : '[]',
        workflow_step: (data.workflow_step as number) || 1,
        created_at: new Date(),
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
  'create org structure request'
);
