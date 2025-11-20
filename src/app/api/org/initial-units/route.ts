import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { serializeBigInt } from '@/utils/serialize';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

export const POST = withBody(
  async (body: unknown, request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const data = body as Record<string, unknown>;

    const requiredFields = ['code', 'name'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Get actor info and request context
    const actorId = BigInt(session.user.id);
    const requestContext = getRequestContext(request);
    const actorInfo = await getActorInfo(session.user.id, db);

    // transaction
    const result = await db.$transaction(async (tx) => {
      // Set history context first
      await setHistoryContext(tx, {
        actorId: actorInfo.actorId,
        actorName: actorInfo.actorName,
        userAgent: requestContext.userAgent || undefined,
        metadata: {
          action: 'create_org_unit',
          code: data.code,
          name: data.name,
        },
      });

      // Tạo draft
      const orgUnit = await tx.orgUnit.create({
        data: {
          code: data.code as string,
          name: data.name as string,
          type: data.type && data.type !== '' ? (data.type as string).toUpperCase() : null,
          parent_id: data.parent_id ? BigInt(data.parent_id as string) : null,
          description: (data.description as string) || null,
          status: 'DRAFT',
          planned_establishment_date: data.planned_establishment_date ? new Date(data.planned_establishment_date as string) : null,
          effective_from: data.planned_establishment_date ? new Date(data.planned_establishment_date as string) : new Date(),
          effective_to: null,
        },
      });

      // Tạo workflow instance
      let workflowInstance = null;
      try {
        workflowInstance = await academicWorkflowEngine.createWorkflow({
          entityType: 'ORG_UNIT',
          entityId: orgUnit.id,
          initiatedBy: actorId,
          metadata: {
            org_unit_id: orgUnit.id.toString(),
            code: orgUnit.code,
            name: orgUnit.name,
            request_details: data.request_details || {},
          },
        }) as any;
      } catch (error) {
        console.error('Failed to create workflow instance:', error);
        // Continue without workflow if creation fails
      }

      // tạo relation với parent
      let orgUnitRelation = null;
      if (data.parent_id) {
        orgUnitRelation = await tx.orgUnitRelation.create({
          data: {
            parent_id: BigInt(data.parent_id as string),
            child_id: orgUnit.id,
            relation_type: 'direct',
            effective_from: data.planned_establishment_date ? new Date(data.planned_establishment_date as string) : new Date(),
            effective_to: null,
            note: 'Initial parent-child relationship',
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      // Serialize BigInt fields for response
      return {
        orgUnit: {
          ...orgUnit,
          id: orgUnit.id.toString(),
          parent_id: orgUnit.parent_id?.toString(),
        },
        workflowInstance: workflowInstance ? {
          ...workflowInstance,
          id: workflowInstance.id?.toString(),
        } : null,
        orgUnitRelation: orgUnitRelation ? {
          ...orgUnitRelation,
          parent_id: orgUnitRelation.parent_id.toString(),
          child_id: orgUnitRelation.child_id.toString(),
        } : null,
      };
    });

    // 5. Create OrgUnitAttachments if attachments provided (outside transaction)
    let attachments: any[] = [];
    // TODO: Temporarily disabled attachments creation to debug
    /*
    if (data.attachments && Array.isArray(data.attachments)) {
      for (const attachment of data.attachments) {
        const orgAttachment = await db.OrgUnitAttachments.create({
          data: {
            org_unit_id: BigInt(result.orgUnit.id),
            attachment_type: 'document', // Default type
            file_name: attachment.file_name,
            file_path: attachment.file_path,
            file_size: attachment.file_size ? BigInt(attachment.file_size) : null,
            mime_type: attachment.mime_type,
            description: attachment.description || null,
            uploaded_by: BigInt(data.requester_id),
            uploaded_at: new Date(),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        attachments.push(orgAttachment);
      }
    }
    */

    // Add attachments to result
    (result as any).attachments = attachments.map(att => ({
      ...att,
      id: att.id.toString(),
      org_unit_id: att.org_unit_id.toString(),
      file_size: att.file_size?.toString(),
      uploaded_by: att.uploaded_by?.toString(),
    }));

    const serializedResult = serializeBigInt(result as Record<string, unknown>);
    return serializedResult;
  },
  'initialize unit'
);

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'draft';
    
    // Get initial units with related data
    const units = await db.orgUnit.findMany({
      where: { status },
      include: {
        org_unit_attachments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const result = {
      items: units,
      total: units.length,
    };

    return result;
  },
  'fetch initial units'
);