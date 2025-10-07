import { withIdParam, withIdAndBody, createErrorResponse } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import {
  ProgramPriority,
  ProgramStatus,
  PROGRAM_PERMISSIONS,
  normalizeProgramPriority,
  normalizeProgramBlockTypeForDb,
  normalizeProgramBlockGroupType,
} from '@/constants/programs';
import { UpdateProgramInput, ProgramWorkflowAction } from '@/lib/api/schemas/program';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { selectProgramDetail } from '@/lib/api/selects/program';
import { academicWorkflowEngine } from '@/lib/academic/workflow-engine';

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
    status: (program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
    stats: {
      student_count: program._count?.StudentAcademicProgress ?? 0,
      block_count: program._count?.ProgramBlock ?? 0,
      course_count: program._count?.ProgramCourseMap ?? 0,
    },
    priority: ProgramPriority.MEDIUM,
    unified_workflow: workflowInstance,
  };
}, CONTEXT_GET);

export const PATCH = withIdAndBody(async (id: string, body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const programId = Number(id);
  if (Number.isNaN(programId)) {
    throw new Error('Invalid program id');
  }

  const payload = body as UpdateProgramInput;

  const numericUserId = Number(session.user.id);
  const actorId = Number.isNaN(numericUserId) ? BigInt(1) : BigInt(numericUserId);
  const userPermissions: string[] = Array.isArray(session.user.permissions)
    ? (session.user.permissions as string[])
    : [];

  const actionPermissionMap: Partial<Record<ProgramWorkflowAction, string>> = {
    submit: PROGRAM_PERMISSIONS.UPDATE,
    review: PROGRAM_PERMISSIONS.REVIEW,
    approve: PROGRAM_PERMISSIONS.APPROVE,
    reject: PROGRAM_PERMISSIONS.REJECT,
    publish: PROGRAM_PERMISSIONS.PUBLISH,
  };

  if (payload.workflow_action) {
    const requiredPermission = actionPermissionMap[payload.workflow_action];
    const hasManagePermission = userPermissions.includes(PROGRAM_PERMISSIONS.MANAGE);
    if (requiredPermission && !hasManagePermission && !userPermissions.includes(requiredPermission)) {
      return createErrorResponse('Forbidden', 'Bạn không có quyền thực hiện thao tác này', 403);
    }
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

  // Comment out direct status update - let workflow engine handle it
  // const resolveStatusFromAction = (action?: ProgramWorkflowAction | null): ProgramStatus | undefined => {
  //   switch (action) {
  //     case 'submit':
  //       return ProgramStatus.SUBMITTED;
  //     case 'review':
  //       return ProgramStatus.REVIEWING;
  //     case 'approve':
  //       return ProgramStatus.APPROVED;
  //     case 'publish':
  //       return ProgramStatus.PUBLISHED;
  //     case 'reject':
  //       return ProgramStatus.REJECTED;
  //     default:
  //       return undefined;
  //   }
  // };

  // const workflowDerivedStatus = resolveStatusFromAction(payload.workflow_action);
  // if (workflowDerivedStatus) {
  //   data.status = workflowDerivedStatus;
  // }

  const result = await db.$transaction(async (tx) => {
    const programBigInt = BigInt(programId);

    await tx.program.update({
      where: { id: programBigInt },
      data,
    });

    const shouldReplaceStructure = Array.isArray(payload.blocks) || Array.isArray(payload.standalone_courses);
    let blockCountOverride: number | null = null;
    let courseCountOverride: number | null = null;

    if (shouldReplaceStructure) {
      const existingBlocks = await tx.programBlock.findMany({
        where: { program_id: programBigInt },
        select: {
          code: true,
          ProgramBlockGroup: {
            select: {
              code: true,
              title: true,
              group_type: true,
              display_order: true,
              ProgramBlockGroupRule: {
                select: {
                  min_credits: true,
                  max_credits: true,
                  min_courses: true,
                  max_courses: true,
                },
              },
            },
            orderBy: { display_order: 'asc' },
          },
          ProgramCourseMap: {
            select: {
              course_id: true,
              ProgramBlockGroup: {
                select: { code: true },
              },
            },
          },
        },
      });

      const previousGroupsByBlock = new Map<string, typeof existingBlocks[number]['ProgramBlockGroup']>();
      const previousCourseGroupByBlock = new Map<string, Map<number, string | null>>();

      for (const block of existingBlocks) {
        const normalizedCode = block.code?.trim() || '';
        previousGroupsByBlock.set(normalizedCode, block.ProgramBlockGroup ?? []);

        const courseGroupMap = new Map<number, string | null>();
        for (const course of block.ProgramCourseMap ?? []) {
          const numericCourseId = Number(course.course_id);
          if (Number.isNaN(numericCourseId)) continue;
          courseGroupMap.set(numericCourseId, course.ProgramBlockGroup?.code ?? null);
        }
        previousCourseGroupByBlock.set(normalizedCode, courseGroupMap);
      }

      await tx.programCourseMap.deleteMany({ where: { program_id: programBigInt } });
      await tx.programBlock.deleteMany({ where: { program_id: programBigInt } });

      const blocksInput = Array.isArray(payload.blocks) ? payload.blocks : [];
      const standaloneInput = Array.isArray(payload.standalone_courses) ? payload.standalone_courses : [];

      let blockCounter = 0;
      let courseCounter = 0;

      for (let index = 0; index < blocksInput.length; index += 1) {
        const blockInput = blocksInput[index];
        const normalizedBlockCode = blockInput.code?.toString().trim() || `BLOCK-${index + 1}`;
        const createdBlock = await tx.programBlock.create({
          data: {
            program_id: programBigInt,
            code: normalizedBlockCode,
            title: blockInput.title?.toString().trim() || `Khối học phần ${index + 1}`,
            block_type: normalizeProgramBlockTypeForDb(blockInput.block_type),
            display_order:
              blockInput.display_order != null
                ? Math.max(1, blockInput.display_order)
                : index + 1,
          },
        });
        blockCounter += 1;

        const createdGroupIdByCode = new Map<string, bigint>();
        const providedGroups = Array.isArray(blockInput.groups) ? blockInput.groups : null;
        if (providedGroups && providedGroups.length > 0) {
          for (let gi = 0; gi < providedGroups.length; gi += 1) {
            const groupInput = providedGroups[gi];
            const newGroup = await tx.programBlockGroup.create({
              data: {
                block_id: createdBlock.id,
                code: groupInput.code,
                title: groupInput.title,
                group_type: normalizeProgramBlockGroupType(groupInput.group_type),
                display_order:
                  groupInput.display_order != null
                    ? Math.max(1, groupInput.display_order)
                    : gi + 1,
              },
            });
            createdGroupIdByCode.set(groupInput.code, newGroup.id);
            const rules = Array.isArray(groupInput.rules) ? groupInput.rules : [];
            for (const rule of rules) {
              await tx.programBlockGroupRule.create({
                data: {
                  group_id: newGroup.id,
                  min_credits: rule.min_credits ?? null,
                  max_credits: rule.max_credits ?? null,
                  min_courses: rule.min_courses ?? null,
                  max_courses: rule.max_courses ?? null,
                },
              });
            }
          }
        } else {
          const previousGroups = previousGroupsByBlock.get(normalizedBlockCode) ?? [];
          for (const previousGroup of previousGroups) {
            const newGroup = await tx.programBlockGroup.create({
              data: {
                block_id: createdBlock.id,
                code: previousGroup.code,
                title: previousGroup.title,
                group_type: previousGroup.group_type,
                display_order: previousGroup.display_order,
              },
            });
            createdGroupIdByCode.set(previousGroup.code, newGroup.id);
            for (const rule of previousGroup.ProgramBlockGroupRule ?? []) {
              await tx.programBlockGroupRule.create({
                data: {
                  group_id: newGroup.id,
                  min_credits: rule.min_credits,
                  max_credits: rule.max_credits,
                  min_courses: rule.min_courses,
                  max_courses: rule.max_courses,
                },
              });
            }
          }
        }

        const previousCourseGroup = previousCourseGroupByBlock.get(normalizedBlockCode);

        if (Array.isArray(blockInput.courses)) {
          for (let courseIndex = 0; courseIndex < blockInput.courses.length; courseIndex += 1) {
            const courseInput = blockInput.courses[courseIndex];
            const numericCourseId = Number(courseInput.course_id);
            if (Number.isNaN(numericCourseId)) continue;

            let groupId: bigint | null = null;
            // Prefer explicit group_code from payload
            const providedGroupCode = (courseInput as { group_code?: string | null }).group_code || null;
            if (providedGroupCode) {
              const mappedId = createdGroupIdByCode.get(providedGroupCode);
              if (mappedId) groupId = mappedId;
            } else if (previousCourseGroup) {
              const groupCode = previousCourseGroup.get(numericCourseId);
              if (groupCode) {
                const restoredGroupId = createdGroupIdByCode.get(groupCode);
                if (restoredGroupId) {
                  groupId = restoredGroupId;
                }
              }
            }

            await tx.programCourseMap.create({
              data: {
                program_id: programBigInt,
                course_id: BigInt(numericCourseId),
                block_id: createdBlock.id,
                group_id: groupId,
                is_required: courseInput.is_required ?? true,
                display_order:
                  courseInput.display_order != null
                    ? Math.max(1, courseInput.display_order)
                    : courseIndex + 1,
              },
            });
            courseCounter += 1;
          }
        }
      }

      for (let index = 0; index < standaloneInput.length; index += 1) {
        const courseInput = standaloneInput[index];
        const numericCourseId = Number(courseInput.course_id);
        if (Number.isNaN(numericCourseId)) continue;

        await tx.programCourseMap.create({
          data: {
            program_id: programBigInt,
            course_id: BigInt(numericCourseId),
            block_id: null,
            is_required: courseInput.is_required ?? true,
            display_order:
              courseInput.display_order != null
                ? Math.max(1, courseInput.display_order)
                : index + 1,
          },
        });
        courseCounter += 1;
      }

      blockCountOverride = blockCounter;
      courseCountOverride = courseCounter;
    }

    let statusOverride: ProgramStatus | undefined;
    let workflowSnapshot = null;
    const workflowAction = payload.workflow_action;

    if (workflowAction) {
      // Handle publish action separately for already approved programs
      if (workflowAction === 'publish') {
        const currentProgram = await tx.program.findUnique({
          where: { id: programBigInt },
          select: { status: true }
        });
        
        if (currentProgram?.status === ProgramStatus.APPROVED) {
          // Direct publish for already approved programs
          statusOverride = ProgramStatus.PUBLISHED;
        } else {
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

            if (updatedInstance.status === 'COMPLETED') {
              statusOverride = ProgramStatus.PUBLISHED;
            }
          } catch (error) {
            // If workflow is already completed, just set to published
            if (error instanceof Error && error.message.includes('already completed')) {
              statusOverride = ProgramStatus.PUBLISHED;
            } else {
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

        const engineAction = engineActionMap[workflowAction];

        if (engineAction) {
          const updatedInstance = await academicWorkflowEngine.processAction(workflowInstance!.id, {
            action: engineAction,
            comments: payload.workflow_notes ?? undefined,
            approverId: actorId,
          });

          switch (updatedInstance.status) {
            case 'PENDING':
              statusOverride = ProgramStatus.DRAFT;
              break;
            case 'IN_PROGRESS':
              // When workflow is in progress, it means it moved to next step after approval
              // Set to APPROVED if this is an approve action
              if (workflowAction === 'approve') {
                statusOverride = ProgramStatus.APPROVED;
              } else {
                statusOverride = ProgramStatus.REVIEWING;
              }
              break;
            case 'APPROVED':
              statusOverride = ProgramStatus.APPROVED;
              break;
            case 'REJECTED':
              statusOverride = ProgramStatus.REJECTED;
              break;
            case 'COMPLETED':
              statusOverride = ProgramStatus.PUBLISHED;
              break;
            default:
              break;
          }
        }
      }

      if (statusOverride) {
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
      blockCount: blockCountOverride ?? program._count?.ProgramBlock ?? 0,
      courseCount: courseCountOverride ?? program._count?.ProgramCourseMap ?? 0,
      workflowInstance: workflowSnapshot,
    };
  });

  return {
    ...result.program,
    status: (result.program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
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
