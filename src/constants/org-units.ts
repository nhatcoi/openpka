// Org Unit workflow enums and helpers

export enum OrgUnitStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export const ORG_UNIT_STATUSES: OrgUnitStatus[] = [
  OrgUnitStatus.DRAFT,
  OrgUnitStatus.REVIEWING,
  OrgUnitStatus.APPROVED,
  OrgUnitStatus.ACTIVE,
  OrgUnitStatus.REJECTED,
  OrgUnitStatus.SUSPENDED,
  OrgUnitStatus.INACTIVE,
  OrgUnitStatus.ARCHIVED,
];

// Helper functions
export function getOrgUnitStatusLabel(status: OrgUnitStatus | string): string {
  switch (status) {
    case OrgUnitStatus.DRAFT:
      return 'Bản nháp';
    case OrgUnitStatus.REVIEWING:
      return 'Đang xem xét';
    case OrgUnitStatus.APPROVED:
      return 'Đã phê duyệt';
    case OrgUnitStatus.ACTIVE:
      return 'Đang hoạt động';
    case OrgUnitStatus.REJECTED:
      return 'Bị từ chối';
    case OrgUnitStatus.SUSPENDED:
      return 'Tạm dừng';
    case OrgUnitStatus.INACTIVE:
      return 'Không hoạt động';
    case OrgUnitStatus.ARCHIVED:
      return 'Đã lưu trữ';
    default:
      return status;
  }
}

export function getOrgUnitStatusColor(status: OrgUnitStatus | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case OrgUnitStatus.ACTIVE:
      return 'success';
    case OrgUnitStatus.APPROVED:
      return 'success';
    case OrgUnitStatus.REVIEWING:
      return 'info';
    case OrgUnitStatus.DRAFT:
      return 'default';
    case OrgUnitStatus.REJECTED:
      return 'error';
    case OrgUnitStatus.SUSPENDED:
      return 'warning';
    case OrgUnitStatus.INACTIVE:
      return 'default';
    case OrgUnitStatus.ARCHIVED:
      return 'default';
    default:
      return 'default';
  }
}

// Org unit workflow stages (mapped to statuses)
export enum OrgUnitWorkflowStage {
  DRAFT = 'DRAFT',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  PUBLISHED = 'published',
}

export const ORG_UNIT_WORKFLOW_STAGES: OrgUnitWorkflowStage[] = [
  OrgUnitWorkflowStage.DRAFT,
  OrgUnitWorkflowStage.REVIEWING,
  OrgUnitWorkflowStage.APPROVED,
  OrgUnitWorkflowStage.PUBLISHED,
];

export function getOrgUnitWorkflowStageLabel(stage: OrgUnitWorkflowStage | string): string {
  switch (stage) {
    case OrgUnitWorkflowStage.DRAFT:
      return 'Soạn thảo';
    case OrgUnitWorkflowStage.REVIEWING:
      return 'Đang xem xét';
    case OrgUnitWorkflowStage.APPROVED:
      return 'Đã phê duyệt';
    case OrgUnitWorkflowStage.PUBLISHED:
      return 'Đã công bố';
    default:
      return stage;
  }
}

// Map org unit status to workflow stage
export function getOrgUnitStageFromStatus(status: OrgUnitStatus | string): OrgUnitWorkflowStage {
  switch (status?.toUpperCase()) {
    case OrgUnitStatus.DRAFT:
      return OrgUnitWorkflowStage.DRAFT;
    case OrgUnitStatus.REVIEWING:
      return OrgUnitWorkflowStage.REVIEWING;
    case OrgUnitStatus.APPROVED:
      return OrgUnitWorkflowStage.APPROVED;
    case OrgUnitStatus.ACTIVE:
      return OrgUnitWorkflowStage.PUBLISHED;
    case OrgUnitStatus.REJECTED:
    case OrgUnitStatus.SUSPENDED:
    case OrgUnitStatus.INACTIVE:
    default:
      return OrgUnitWorkflowStage.DRAFT;
  }
}

// Compute step index for progress bar
export function computeOrgUnitStepIndex(status: OrgUnitStatus | string): number {
  const stage = getOrgUnitStageFromStatus(status);
  switch (stage) {
    case OrgUnitWorkflowStage.DRAFT:
      return 0;
    case OrgUnitWorkflowStage.REVIEWING:
      return 1;
    case OrgUnitWorkflowStage.APPROVED:
      return 2;
    case OrgUnitWorkflowStage.PUBLISHED:
      return 3;
    default:
      return 0;
  }
}

