import { NextRequest } from 'next/server';
import { withIdParam, withIdAndBody } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission, createForbiddenResponse } from '@/lib/auth/api-permissions';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { OrgUnitStatus } from '@/constants/org-units';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';

export const GET = withIdParam(
  async (id: string, request: Request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const unitId = BigInt(id);

    const unit = await db.orgUnit.findUnique({
      where: { id: unitId },
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

    try {
      requirePermission(session, 'org_unit.unit.update');
    } catch (error) {
      throw error;
    }

    const unitId = BigInt(id);
    const data = body as Record<string, unknown>;
    const { name, code, description, type, status, parent_id, workflow_notes, workflow_action } = data;

    const actorId = BigInt(session.user.id);
    const requestContext = getRequestContext(request);
    const actorInfo = await getActorInfo(session.user.id, db);
    
    const resolveStatusFromAction = (action?: string | null): OrgUnitStatus | undefined => {
      const a = (action || '').toUpperCase();
      if (a === 'SUBMIT' || a === 'REVIEW') return OrgUnitStatus.REVIEWING;
      if (a === 'APPROVE') return OrgUnitStatus.APPROVED;
      if (a === 'REJECT') return OrgUnitStatus.REJECTED;
      if (a === 'PUBLISH' || a === 'ACTIVATE') return OrgUnitStatus.ACTIVE;
      if (a === 'RETURN' || a === 'REQUEST_EDIT') return OrgUnitStatus.DRAFT;
      if (a === 'SUSPEND') return OrgUnitStatus.SUSPENDED;
      if (a === 'CANCEL') return OrgUnitStatus.DRAFT;
      if (a === 'ARCHIVE') return OrgUnitStatus.ARCHIVED;
      return undefined;
    };

    const actionStr = String(workflow_action || '');
    const workflowDerivedStatus = resolveStatusFromAction(actionStr);
    
    // Validate name and code only if they are being updated (not workflow-only actions)
    if (name !== undefined || code !== undefined) {
      if (!name || !code) {
        throw new Error('Name and code are required when updating unit information');
      }
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
    if (status !== undefined) {
      updateData.status = status ? (status as string).toUpperCase() : null;
    } else if (workflowDerivedStatus) {
      updateData.status = workflowDerivedStatus;
    }
    if (parent_id !== undefined) updateData.parent_id = parent_id ? BigInt(parent_id as string) : null;

    const result = await db.$transaction(async (tx) => {
      await setHistoryContext(tx, {
        actorId: actorInfo.actorId ?? undefined,
        actorName: actorInfo.actorName ?? undefined,
        userAgent: requestContext.userAgent || undefined,
        metadata: {
          org_unit_id: id,
          status: updateData.status,
          workflow_action: workflow_action,
        },
      });

      const existingUnit = await tx.orgUnit.findUnique({
        where: { id: unitId },
        select: { id: true, status: true, code: true, name: true },
      });

      if (!existingUnit) {
        throw new Error('Unit not found');
      }

      // Check for duplicate code if code is being updated
      if (updateData.code && updateData.code !== existingUnit.code) {
        const codeUpper = updateData.code.toUpperCase();
        const existingByCode = await tx.orgUnit.findFirst({
          where: {
            code: codeUpper,
            id: { not: unitId },
          },
        });

        if (existingByCode) {
          throw new Error(`Mã đơn vị "${codeUpper}" đã tồn tại, vui lòng nhập mã khác.`);
        }
      }

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== existingUnit.name) {
        const existingByName = await tx.orgUnit.findFirst({
          where: {
            name: updateData.name,
            id: { not: unitId },
          },
        });

        if (existingByName) {
          throw new Error(`Tên đơn vị "${updateData.name}" đã tồn tại, vui lòng nhập tên khác.`);
        }
      }

      const updatedUnit = await tx.orgUnit.update({
        where: { id: unitId },
        data: updateData as any,
      });

      // Đồng bộ OrgUnitRelation nếu parent_id được cập nhật
      if (parent_id !== undefined) {
        const { syncRelationFromParentId } = await import('@/lib/org/unit-relation-sync');
        await syncRelationFromParentId(unitId, updateData.parent_id ?? null, tx);
      }

      if (workflow_action || updateData.status) {
        try {
          let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('ORG_UNIT', unitId);
          if (!workflowInstance) {
            try {
              workflowInstance = await academicWorkflowEngine.createWorkflow({
                entityType: 'ORG_UNIT',
                entityId: unitId,
                initiatedBy: actorId,
                metadata: { org_unit_id: id },
              }) as any;
            } catch (workflowError) {
              // If no workflow definition exists, skip workflow creation
              console.warn('No workflow definition for ORG_UNIT, skipping workflow creation:', workflowError);
              workflowInstance = null;
            }
          }

          if (workflowInstance) {
            const mapStatusToAction = (s: string): string => {
              const statusUpper = s.toUpperCase();
              if (statusUpper === OrgUnitStatus.REVIEWING) return 'REVIEW';
              if (statusUpper === OrgUnitStatus.APPROVED) return 'APPROVE';
              if (statusUpper === OrgUnitStatus.REJECTED) return 'REJECT';
              if (statusUpper === OrgUnitStatus.ACTIVE) return 'PUBLISH';
              if (statusUpper === OrgUnitStatus.DRAFT) return 'RETURN';
              return 'APPROVE';
            };

            if (workflow_action) {
              try {
                await academicWorkflowEngine.processAction((workflowInstance as any).id, {
                  action: actionStr.toUpperCase(),
                  comments: workflow_notes as string || undefined,
                  approverId: actorId,
                });
              } catch (error) {
                console.error('Workflow action error:', error);
              }
            } else if (updateData.status && existingUnit.status !== updateData.status) {
              try {
                await tx.approvalRecord.create({
                  data: {
                    workflow_instance_id: BigInt((workflowInstance as any).id),
                    approver_id: actorId,
                    action: mapStatusToAction(updateData.status),
                    comments: workflow_notes as string || null,
                    approved_at: new Date(),
                  },
                });
              } catch (error) {
                console.error('Approval record creation error:', error);
              }
            }
          }
        } catch (error) {
          // If workflow operations fail, log but don't fail the update
          console.warn('Workflow operations failed, continuing with unit update:', error);
        }
      }

      return updatedUnit;
    });

    return result;
  },
  'update org unit'
);

export const DELETE = withIdParam(
  async (id: string, request: Request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    try {
      requirePermission(session, 'org_unit.unit.delete');
    } catch (error) {
      throw error;
    }

    const unitId = BigInt(id);
    const requestContext = getRequestContext(request);
    const actorInfo = await getActorInfo(session.user.id, db);

    const result = await db.$transaction(async (tx) => {
      await setHistoryContext(tx, {
        actorId: actorInfo.actorId ?? undefined,
        actorName: actorInfo.actorName ?? undefined,
        userAgent: requestContext.userAgent || undefined,
        metadata: {
          org_unit_id: id,
          action: 'delete',
        },
      });

      const [assignmentsCount, childrenCount, coursesCount, majorsCount, programsCount, cohortsCount, sectionsCount, classSectionsCount] = await Promise.all([
        (tx as any).orgAssignment.count({ where: { org_unit_id: unitId } }),
        tx.orgUnit.count({ where: { parent_id: unitId } }),
        (tx as any).course.count({ where: { org_unit_id: unitId } }),
        (tx as any).major.count({ where: { org_unit_id: unitId } }),
        (tx as any).program.count({ where: { org_unit_id: unitId } }),
        (tx as any).cohort.count({ where: { org_unit_id: unitId } }),
        (tx as any).section.count({ where: { org_unit_id: unitId } }),
        (tx as any).classSection.count({ where: { org_unit_id: unitId } }),
      ]);

      const criticalRelations = [];
      if (childrenCount > 0) criticalRelations.push(`${childrenCount} đơn vị con`);
      if (coursesCount > 0) criticalRelations.push(`${coursesCount} học phần`);
      if (majorsCount > 0) criticalRelations.push(`${majorsCount} ngành đào tạo`);
      if (programsCount > 0) criticalRelations.push(`${programsCount} chương trình`);
      if (cohortsCount > 0) criticalRelations.push(`${cohortsCount} khóa học`);
      if (sectionsCount > 0) criticalRelations.push(`${sectionsCount} lớp`);
      if (classSectionsCount > 0) criticalRelations.push(`${classSectionsCount} lớp học phần`);

      if (criticalRelations.length > 0) {
        throw new Error(`Không thể xóa đơn vị vì còn ${criticalRelations.join(', ')} liên quan. Vui lòng xử lý các mối quan hệ này trước.`);
      }

      if (assignmentsCount > 0) {
        await (tx as any).orgAssignment.deleteMany({ where: { org_unit_id: unitId } });
      }

      const deletedUnit = await tx.orgUnit.delete({
        where: { id: unitId },
      });

      return deletedUnit;
    });

    return result;
  },
  'delete org unit'
);