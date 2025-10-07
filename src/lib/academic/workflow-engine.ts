import { db } from '@/lib/db';

export interface AcademicWorkflowConfig {
  entityType: 'COURSE' | 'PROGRAM' | 'MAJOR';
  entityId: bigint;
  initiatedBy: bigint;
  metadata?: any;
}

export interface AcademicWorkflowAction {
  action: string;
  comments?: string;
  attachments?: any;
  approverId: bigint;
}

export class AcademicWorkflowEngine {
  /**
   * Create workflow instance for academic entities
   */
  async createWorkflow(config: AcademicWorkflowConfig) {
    // Get workflow definition
    const workflow = await db.workflowDefinition.findFirst({
      where: { 
        entity_type: config.entityType,
        is_active: true 
      }
    });

    if (!workflow) {
      throw new Error(`No active workflow found for entity type: ${config.entityType}`);
    }

    // Create workflow instance
    const instance = await db.workflowInstance.create({
      data: {
        workflow_id: workflow.id,
        entity_type: config.entityType,
        entity_id: config.entityId,
        current_step: 1,
        status: 'PENDING',
        initiated_by: config.initiatedBy,
        initiated_at: new Date(),
        metadata: config.metadata || {}
      }
    });

    // Get first step
    const firstStep = await db.workflowStep.findFirst({
      where: {
        workflow_id: workflow.id,
        step_order: 1
      }
    });

    if (firstStep) {
      // Create initial approval record
      await db.approvalRecord.create({
        data: {
          workflow_instance_id: instance.id,
          step_id: firstStep.id,
          approver_id: config.initiatedBy,
          action: 'PENDING',
          due_date: new Date(Date.now() + (firstStep.timeout_days || 3) * 24 * 60 * 60 * 1000),
          is_escalated: false
        }
      });
    }

    return instance;
  }

  /**
   * Process workflow action
   */
  async processAction(instanceId: bigint, action: AcademicWorkflowAction) {
    const instance = await db.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { step_order: 'asc' }
            }
          }
        }
      }
    });

    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    if (instance.status === 'COMPLETED' || instance.status === 'REJECTED') {
      throw new Error(`Workflow instance ${instanceId} is already completed`);
    }

    // Get current step
    const currentStep = instance.workflow.steps.find(
      step => step.step_order === instance.current_step
    );

    if (!currentStep) {
      throw new Error(`Current step not found for workflow instance ${instanceId}`);
    }

    // Create approval record
    await db.approvalRecord.create({
      data: {
        workflow_instance_id: instanceId,
        step_id: currentStep.id,
        approver_id: action.approverId,
        action: action.action.toUpperCase(),
        comments: action.comments,
        attachments: action.attachments,
        approved_at: new Date(),
        due_date: new Date(Date.now() + (currentStep.timeout_days || 3) * 24 * 60 * 60 * 1000),
        is_escalated: false
      }
    });

    // Determine next step or completion
    let nextStatus = instance.status;
    let nextStep = instance.current_step;
    let completedAt: Date | null = null;

    if (action.action.toUpperCase() === 'APPROVE') {
      if (instance.current_step < instance.workflow.steps.length) {
        nextStep = instance.current_step + 1;
        nextStatus = 'IN_PROGRESS';
      } else {
        nextStatus = 'COMPLETED';
        completedAt = new Date();
      }
    } else if (action.action.toUpperCase() === 'REJECT') {
      nextStatus = 'REJECTED';
      completedAt = new Date();
    } else if (action.action.toUpperCase() === 'RETURN') {
      nextStatus = 'PENDING';
      nextStep = 1; // Return to first step
    }

    // Update workflow instance
    const updatedInstance = await db.workflowInstance.update({
      where: { id: instanceId },
      data: {
        current_step: nextStep,
        status: nextStatus,
        completed_at: completedAt,
        updated_at: new Date()
      }
    });

    return updatedInstance;
  }

  /**
   * Get workflow instances for academic entities
   */
  async getWorkflowInstances(
    entityType?: 'COURSE' | 'PROGRAM' | 'MAJOR',
    status?: string
  ) {
    const where: any = {};
    
    if (entityType) {
      where.entity_type = entityType;
    }
    
    if (status) {
      where.status = status;
    }

    return await db.workflowInstance.findMany({
      where,
      include: {
        workflow: {
          include: {
            steps: true
          }
        },
        approval_records: {
          include: {
            approver: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          },
          orderBy: { approved_at: 'desc' }
        }
      },
      orderBy: { initiated_at: 'desc' }
    });
  }

  /**
   * Get workflow instance by entity
   */
  async getWorkflowByEntity(entityType: string, entityId: bigint) {
    try {
      return await db.workflowInstance.findFirst({
        where: {
          entity_type: entityType,
          entity_id: entityId
        },
        include: {
          workflow: {
            include: {
              steps: true
            }
          },
          approval_records: {
            include: {
              approver: {
                select: {
                  id: true,
                  full_name: true,
                  email: true
                }
              }
            },
            orderBy: { approved_at: 'desc' }
          }
        }
      });
    } catch (error) {
      console.error('Error in getWorkflowByEntity:', error);
      return null;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData() {
    const workflows = await this.getWorkflowInstances();

    return {
      total: workflows.length,
      pending: workflows.filter(w => w.status === 'PENDING').length,
      inProgress: workflows.filter(w => w.status === 'IN_PROGRESS').length,
      approved: workflows.filter(w => w.status === 'APPROVED').length,
      rejected: workflows.filter(w => w.status === 'REJECTED').length,
      completed: workflows.filter(w => w.status === 'COMPLETED').length,
      overdue: workflows.filter(w => {
        if (w.status === 'COMPLETED' || w.status === 'REJECTED') return false;
        const latestApproval = w.approval_records[0];
        return latestApproval && new Date() > latestApproval.due_date;
      }).length,
      byEntity: {
        COURSE: workflows.filter(w => w.entity_type === 'COURSE').length,
        PROGRAM: workflows.filter(w => w.entity_type === 'PROGRAM').length,
        MAJOR: workflows.filter(w => w.entity_type === 'MAJOR').length
      }
    };
  }
}

export const academicWorkflowEngine = new AcademicWorkflowEngine();
