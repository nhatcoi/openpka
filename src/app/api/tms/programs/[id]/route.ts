import { withIdParam, withIdAndBody, createErrorResponse } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import {
  ProgramPriority,
  PROGRAM_PERMISSIONS,
  normalizeProgramPriority,
  normalizeProgramBlockTypeForDb,
  normalizeProgramBlockGroupType,
} from '@/constants/programs';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import { UpdateProgramInput, ProgramWorkflowAction } from '@/lib/api/schemas/program';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { selectProgramDetail } from '@/lib/api/selects/program';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';
import { setHistoryContext, getRequestContext, getActorInfo } from '@/lib/db-history-context';

const CONTEXT_GET = 'get program';
const CONTEXT_UPDATE = 'update program';
const CONTEXT_DELETE = 'delete program';

export const GET = withIdParam(async (id: string) => {
  const programId = Number(id);
  if (Number.isNaN(programId)) {
    throw new Error('Invalid program id');
  }

  const program = await db.program.findUnique({
    where: { id: BigInt(programId) },
    select: selectProgramDetail,
  });

  if (!program) {
    throw new Error('Program not found');
  }

  const workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('PROGRAM', BigInt(programId));

  return {
    ...program,
    status: (program.status ?? WorkflowStatus.DRAFT) as string,
    stats: {
      student_count: program._count?.StudentAcademicProgress ?? 0,
      block_count: program.ProgramCourseMap?.length ?? 0,
      course_count: program.ProgramCourseMap?.length ?? 0,
    },
    priority: ProgramPriority.MEDIUM,
    unified_workflow: workflowInstance,
  };
}, CONTEXT_GET);

export const PATCH = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const programId = Number(id);
  if (Number.isNaN(programId)) {
    throw new Error('Invalid program id');
  }

  const payload = body as UpdateProgramInput;

  // Get request context and actor info for history tracking
  const requestContext = getRequestContext(request);
  const actorInfo = await getActorInfo(session.user.id, db);

  const numericUserId = Number(session.user.id);
  const actorId = Number.isNaN(numericUserId) ? BigInt(1) : BigInt(numericUserId);
  const userPermissions: string[] = Array.isArray(session.user.permissions)
    ? (session.user.permissions as string[])
    : [];

  const actionPermissionMap: Partial<Record<ProgramWorkflowAction, string>> = {
    submit: PROGRAM_PERMISSIONS.UPDATE,
    review: PROGRAM_PERMISSIONS.APPROVE,
    approve: PROGRAM_PERMISSIONS.APPROVE,
    reject: PROGRAM_PERMISSIONS.APPROVE,
    publish: PROGRAM_PERMISSIONS.PUBLISH,
  };

  if (payload.workflow_action) {
    const requiredPermission = actionPermissionMap[payload.workflow_action];
    if (requiredPermission) {
      requirePermission(session, requiredPermission);
    }
  } else {
    // For regular updates, check update permission
    requirePermission(session, PROGRAM_PERMISSIONS.UPDATE);
  }

  const data: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (!Number.isNaN(numericUserId)) {
    data.updated_by = BigInt(numericUserId);
  }

  if (payload.code) data.code = payload.code;
  if (payload.name_vi) data.name_vi = payload.name_vi;
  if (payload.name_en !== undefined) data.name_en = payload.name_en || null;
  if (payload.description !== undefined) data.description = payload.description || null;
  if (payload.version) data.version = payload.version;
  if (payload.total_credits !== undefined) data.total_credits = payload.total_credits;
  if (payload.status) data.status = payload.status;
  if (payload.plo !== undefined) data.plo = payload.plo;
  if (payload.effective_from !== undefined) {
    data.effective_from = payload.effective_from ? new Date(payload.effective_from) : null;
  }
  if (payload.effective_to !== undefined) {
    data.effective_to = payload.effective_to ? new Date(payload.effective_to) : null;
  }
  if (payload.org_unit_id !== undefined) {
    const orgUnitId = payload.org_unit_id ? BigInt(Number(payload.org_unit_id)) : null;
    data.org_unit_id = orgUnitId;
  }
  if (payload.major_id !== undefined) {
    const majorId = payload.major_id ? BigInt(Number(payload.major_id)) : null;
    data.major_id = majorId;
  }

  // Directly derive program status from workflow action (immediate status update)
  const resolveStatusFromAction = (action?: string | null): string | undefined => {
    const a = (action || '').toLowerCase();
    if (a === 'submit' || a === 'review') return WorkflowStatus.REVIEWING;
    if (a === 'approve') return WorkflowStatus.APPROVED;
    if (a === 'reject') return WorkflowStatus.REJECTED;
    if (a === 'publish' || a === 'science_council_publish') return WorkflowStatus.PUBLISHED;
    if (a === 'request_edit') return WorkflowStatus.DRAFT;
    return undefined;
  };

  const actionStr = String(payload.workflow_action || '');
  const workflowDerivedStatus = resolveStatusFromAction(actionStr);
  if (workflowDerivedStatus) {
    data.status = workflowDerivedStatus;
  }

  const result = await db.$transaction(async (tx) => {
    const programBigInt = BigInt(programId);

    // IMPORTANT: Set history context FIRST before any other queries
    // This ensures session variables are available when triggers fire
    await setHistoryContext(tx, {
      actorId: actorInfo.actorId,
      actorName: actorInfo.actorName,
      userAgent: requestContext.userAgent || undefined,
      metadata: {
        program_id: programId,
        status: data.status,
        workflow_action: payload.workflow_action,
      },
    });

    await tx.program.update({
      where: { id: programBigInt },
      data,
    });

    const shouldReplaceStructure = Array.isArray((payload as any).block_templates);
    let blockCountOverride: number | null = null;
    let courseCountOverride: number | null = null;

    if (shouldReplaceStructure) {
      // Delete existing course mappings
      await tx.programCourseMap.deleteMany({ where: { program_id: programBigInt } });

      // Create new course mappings
      const templatesInput = Array.isArray((payload as any).block_templates) ? (payload as any).block_templates : [];
      let blockCounter = 0;
      let courseCounter = 0;

      for (let index = 0; index < templatesInput.length; index += 1) {
        const templateInput = templatesInput[index];
        const numericTemplateId = Number(templateInput.template_id);
        if (Number.isNaN(numericTemplateId)) continue;

        await tx.programCourseMap.create({
          data: {
            program_id: programBigInt,
            block_id: BigInt(numericTemplateId),
            display_order: templateInput.display_order ? Math.max(1, templateInput.display_order) : index + 1,
            is_required: templateInput.is_required ?? true,
          },
        });
        blockCounter += 1;
        courseCounter += 1; // Each mapping represents one course
      }

      blockCountOverride = blockCounter;
      courseCountOverride = courseCounter;
    }

    let statusOverride: string | undefined;
    let workflowSnapshot = null;
    const workflowAction = payload.workflow_action;

    // If status was directly provided, persist an approval history entry
    const directStatus = (payload as any).status as string | undefined;
    if (directStatus) {
      // Ensure workflow instance exists
      let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('PROGRAM', programBigInt);
      if (!workflowInstance) {
        workflowInstance = await academicWorkflowEngine.createWorkflow({
          entityType: 'PROGRAM',
          entityId: programBigInt,
          initiatedBy: actorId,
          metadata: { program_id: programId },
        }) as any;
      }

      const mapStatusToAction = (s: string): string => {
        const normalized = (s || '').toUpperCase();
        if (normalized.includes('REVIEWING')) return 'REVIEW';
        if (normalized.includes('APPROVED')) return 'APPROVE';
        if (normalized.includes('REJECTED')) return 'REJECT';
        if (normalized.includes('PUBLISHED')) return 'PUBLISH';
        return 'RETURN';
      };

      await tx.approvalRecord.create({
        data: {
          workflow_instance_id: BigInt((workflowInstance as any).id),
          approver_id: actorId,
          action: mapStatusToAction(directStatus),
          comments: (payload as any).workflow_notes || null,
          approved_at: new Date(),
        },
      });
    }

    if (workflowAction) {
      // Handle publish action separately for already approved programs
      if (actionStr === 'publish') {
        const currentProgram = await tx.program.findUnique({
          where: { id: programBigInt },
          select: { status: true }
        });
        
        if (!workflowDerivedStatus && currentProgram?.status !== WorkflowStatus.APPROVED) {
          // Use workflow for other cases
          let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('PROGRAM', programBigInt);

          if (!workflowInstance) {
            workflowInstance = await academicWorkflowEngine.createWorkflow({
              entityType: 'PROGRAM',
              entityId: programBigInt,
              initiatedBy: actorId,
              metadata: {
                program_id: programId,
                code: payload.code ?? undefined,
              },
            }) as any;
          }

          try {
            const updatedInstance = await academicWorkflowEngine.processAction(workflowInstance!.id, {
              action: 'APPROVE',
              comments: payload.workflow_notes ?? undefined,
              approverId: actorId,
            });

            // Do not override status if direct mapping already applied
          } catch (error) {
            // If workflow is already completed, just set to published
            if (!(error instanceof Error && error.message.includes('already completed'))) {
              throw error;
            }
          }
        }
      } else {
        // Handle other workflow actions
        let workflowInstance = await academicWorkflowEngine.getWorkflowByEntity('PROGRAM', programBigInt);

        if (!workflowInstance) {
          workflowInstance = await academicWorkflowEngine.createWorkflow({
            entityType: 'PROGRAM',
            entityId: programBigInt,
            initiatedBy: actorId,
            metadata: {
              program_id: programId,
              code: payload.code ?? undefined,
            },
          }) as any;
        }

        const engineActionMap: Partial<Record<ProgramWorkflowAction, 'APPROVE' | 'REJECT' | 'RETURN'>> = {
          review: 'APPROVE',
          approve: 'APPROVE',
          reject: 'REJECT',
        };
        let engineAction: 'APPROVE' | 'REJECT' | 'RETURN' | undefined = engineActionMap[workflowAction];
        if (!engineAction && actionStr === 'request_edit') engineAction = 'RETURN';

        if (engineAction) {
          // Check if workflow instance is already completed
          if (workflowInstance && (workflowInstance.status === 'COMPLETED' || workflowInstance.status === 'REJECTED')) {
            // If workflow is completed (REJECTED), we need to create a new workflow instance for re-approval
            if (actionStr === 'approve' || actionStr === 'review') {
              // Create a new workflow instance for re-approval
              workflowInstance = await academicWorkflowEngine.createWorkflow({
                entityType: 'PROGRAM',
                entityId: programBigInt,
                initiatedBy: actorId,
                metadata: {
                  program_id: programId,
                  code: payload.code ?? undefined,
                },
              }) as any;
            } else {
              // For other actions on completed workflow, return error
              throw new Error(`Cannot perform ${workflowAction} on completed workflow instance ${workflowInstance?.id}`);
            }
          }

          const updatedInstance = await academicWorkflowEngine.processAction(workflowInstance!.id, {
            action: engineAction,
            comments: payload.workflow_notes ?? undefined,
            approverId: actorId,
          });

          // Keep engine state for history; do not override status if direct mapping exists
          if (!workflowDerivedStatus) {
            switch (updatedInstance.status) {
              case 'PENDING':
                statusOverride = WorkflowStatus.REVIEWING;
                break;
              case 'IN_PROGRESS':
                statusOverride = WorkflowStatus.REVIEWING;
                break;
              case 'APPROVED':
                statusOverride = WorkflowStatus.APPROVED;
                break;
              case 'REJECTED':
                statusOverride = WorkflowStatus.REJECTED;
                break;
              case 'COMPLETED':
                statusOverride = WorkflowStatus.PUBLISHED;
                break;
              default:
                break;
            }
          }
        }
      }

      if (!workflowDerivedStatus && statusOverride) {
        await tx.program.update({
          where: { id: programBigInt },
          data: { status: statusOverride },
        });
      }

      workflowSnapshot = await academicWorkflowEngine.getWorkflowByEntity('PROGRAM', programBigInt);
    }

    const program = await tx.program.findUnique({
      where: { id: programBigInt },
      select: selectProgramDetail,
    });

    if (!program) {
      throw new Error('Program not found after update');
    }

    return {
      program,
      blockCount: blockCountOverride ?? program.ProgramCourseMap?.length ?? 0,
      courseCount: courseCountOverride ?? program.ProgramCourseMap?.length ?? 0,
      workflowInstance: workflowSnapshot,
    };
  });

  return {
    ...result.program,
    status: (result.program.status ?? WorkflowStatus.DRAFT) as string,
    stats: {
      student_count: result.program._count?.StudentAcademicProgress ?? 0,
      block_count: result.blockCount,
      course_count: result.courseCount,
    },
    priority: normalizeProgramPriority(payload.priority || ProgramPriority.MEDIUM),
    unified_workflow: result.workflowInstance,
  };
}, CONTEXT_UPDATE);

export const DELETE = withIdParam(async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const programId = Number(id);
  if (Number.isNaN(programId)) {
    throw new Error('Invalid program id');
  }

  await db.program.delete({
    where: { id: BigInt(programId) },
  });

  return { success: true };
}, CONTEXT_DELETE);
