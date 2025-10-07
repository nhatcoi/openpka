import { NextRequest } from 'next/server';
import { withErrorHandling, withBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { serializeBigInt } from '@/utils/serialize';

export const POST = withBody(
  async (body: unknown) => {
    const data = body as Record<string, unknown>;

    const requiredFields = ['code', 'name', 'campus_id', 'owner_org_id', 'requester_id'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // transaction
    const result = await db.$transaction(async (tx) => {
      // Tạo draft
      const orgUnit = await tx.orgUnit.create({
        data: {
          code: data.code as string,
          name: data.name as string,
          type: data.type && data.type !== '' ? (data.type as string).toUpperCase() : null,
          campus_id: BigInt(data.campus_id as string),
          parent_id: data.parent_id ? BigInt(data.parent_id as string) : null,
          description: (data.description as string) || null,
          status: 'DRAFT',
          planned_establishment_date: data.planned_establishment_date ? new Date(data.planned_establishment_date as string) : null,
          effective_from: data.planned_establishment_date ? new Date(data.planned_establishment_date as string) : new Date(),
          effective_to: null,
        },
      });

      // tạo structure request
      const orgStructureRequest = await tx.orgStructureRequest.create({
        data: {
          request_type: 'created',
          status: 'SUBMITTED',
          requester_id: BigInt(data.requester_id as string),
          target_org_unit_id: orgUnit.id,
          owner_org_id: BigInt(data.owner_org_id as string),
          payload: data.request_details ? (() => {
            if (typeof data.request_details === 'string') {
              try {
                return JSON.parse(data.request_details as string);
              } catch {
                return { description: data.request_details };
              }
            }
            return data.request_details;
          })() : {},
          attachments: data.attachments ? JSON.stringify(data.attachments) : '[]',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // tạo history
      const orgUnitHistory = await tx.orgUnitHistory.create({
        data: {
          org_unit_id: orgUnit.id,
          change_type: 'created',
          old_name: null,
          new_name: orgUnit.name,
          details: {
            code: orgUnit.code,
            type: orgUnit.type,
            status: orgUnit.status,
            campus_id: orgUnit.campus_id?.toString(),
            description: orgUnit.description,
            planned_establishment_date: orgUnit.planned_establishment_date,
          },
          changed_at: new Date(),
        },
      });

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
          campus_id: orgUnit.campus_id?.toString(),
        },
        orgStructureRequest: {
          ...orgStructureRequest,
          id: orgStructureRequest.id.toString(),
          target_org_unit_id: orgStructureRequest.target_org_unit_id?.toString(),
          requester_id: orgStructureRequest.requester_id?.toString(),
          owner_org_id: orgStructureRequest.owner_org_id?.toString(),
        },
        orgUnitHistory: {
          ...orgUnitHistory,
          id: orgUnitHistory.id.toString(),
          org_unit_id: orgUnitHistory.org_unit_id.toString(),
        },
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
        org_structure_request: true,
        org_unit_attachments: true,
        campus: true,
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