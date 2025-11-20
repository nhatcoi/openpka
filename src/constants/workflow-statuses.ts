export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export type WorkflowStatusKey = `${WorkflowStatus}`;
export type WorkflowResourceType = 'program' | 'major' | 'course' | 'cohort' | 'org_unit';

export const WORKFLOW_STATUS_VALUES: WorkflowStatus[] = [
  WorkflowStatus.DRAFT,
  WorkflowStatus.REVIEWING,
  WorkflowStatus.APPROVED,
  WorkflowStatus.REJECTED,
  WorkflowStatus.PUBLISHED,
  WorkflowStatus.ARCHIVED,
] as const;

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  [WorkflowStatus.DRAFT]: 'Bản nháp',
  [WorkflowStatus.REVIEWING]: 'Đang xem xét',
  [WorkflowStatus.APPROVED]: 'Đã phê duyệt',
  [WorkflowStatus.REJECTED]: 'Từ chối',
  [WorkflowStatus.PUBLISHED]: 'Đã xuất bản',
  [WorkflowStatus.ARCHIVED]: 'Lưu trữ',
};

const STATUS_COLORS: Record<WorkflowStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  [WorkflowStatus.DRAFT]: 'default',
  [WorkflowStatus.REVIEWING]: 'warning',
  [WorkflowStatus.APPROVED]: 'success',
  [WorkflowStatus.REJECTED]: 'error',
  [WorkflowStatus.PUBLISHED]: 'success',
  [WorkflowStatus.ARCHIVED]: 'default',
};

export const WORKFLOW_STATUS_OPTIONS = WORKFLOW_STATUS_VALUES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export function getWorkflowStatusLabel(status: WorkflowStatus | string): string {
  const key = (status ?? '').toUpperCase() as WorkflowStatus;
  return STATUS_LABELS[key] ?? status ?? '';
}

export function getWorkflowStatusColor(
  status: WorkflowStatus | string
): 'default' | 'info' | 'warning' | 'success' | 'error' {
  const key = (status ?? '').toUpperCase() as WorkflowStatus;
  return STATUS_COLORS[key] ?? 'default';
}

const FALLBACK_STATUS_MAP: Record<string, WorkflowStatus> = {
  PROPOSED: WorkflowStatus.DRAFT,
  CLOSED: WorkflowStatus.ARCHIVED,
};

const RESOURCE_STATUS_MAPPING: Record<WorkflowResourceType, Record<string, WorkflowStatus>> = {
  program: {
    DRAFT: WorkflowStatus.DRAFT,
    SUBMITTED: WorkflowStatus.REVIEWING,
    REVIEWING: WorkflowStatus.REVIEWING,
    APPROVED: WorkflowStatus.APPROVED,
    REJECTED: WorkflowStatus.REJECTED,
    PUBLISHED: WorkflowStatus.PUBLISHED,
    ARCHIVED: WorkflowStatus.ARCHIVED,
  },
  major: {
    DRAFT: WorkflowStatus.DRAFT,
    REVIEWING: WorkflowStatus.REVIEWING,
    APPROVED: WorkflowStatus.APPROVED,
    REJECTED: WorkflowStatus.REJECTED,
    PUBLISHED: WorkflowStatus.PUBLISHED,
    ARCHIVED: WorkflowStatus.ARCHIVED,
  },
  course: {
    DRAFT: WorkflowStatus.DRAFT,
    SUBMITTED: WorkflowStatus.REVIEWING,
    REVIEWING: WorkflowStatus.REVIEWING,
    APPROVED: WorkflowStatus.APPROVED,
    REJECTED: WorkflowStatus.REJECTED,
    PUBLISHED: WorkflowStatus.PUBLISHED,
    ARCHIVED: WorkflowStatus.ARCHIVED,
  },
  cohort: {
    PLANNING: WorkflowStatus.DRAFT,
    RECRUITING: WorkflowStatus.REVIEWING,
    ACTIVE: WorkflowStatus.APPROVED,
    GRADUATED: WorkflowStatus.PUBLISHED,
    SUSPENDED: WorkflowStatus.ARCHIVED,
    ARCHIVED: WorkflowStatus.ARCHIVED,
  },
  org_unit: {
    DRAFT: WorkflowStatus.DRAFT,
    REVIEWING: WorkflowStatus.REVIEWING,
    APPROVED: WorkflowStatus.APPROVED,
    REJECTED: WorkflowStatus.REJECTED,
    PUBLISHED: WorkflowStatus.PUBLISHED,
    ACTIVE: WorkflowStatus.PUBLISHED,
    ARCHIVED: WorkflowStatus.ARCHIVED,
  },
};

export function normalizeWorkflowStatusFromResource(
  resourceType: WorkflowResourceType,
  status?: string | null
): WorkflowStatus {
  const normalized = (status ?? '').toUpperCase();

  if (normalized && RESOURCE_STATUS_MAPPING[resourceType][normalized]) {
    return RESOURCE_STATUS_MAPPING[resourceType][normalized];
  }

  return FALLBACK_STATUS_MAP[normalized] ?? WorkflowStatus.DRAFT;
}

export function getResourceStatusesForWorkflowStatus(
  resourceType: WorkflowResourceType,
  workflowStatus: WorkflowStatus
): string[] {
  const mapping = RESOURCE_STATUS_MAPPING[resourceType];
  return Object.entries(mapping)
    .filter(([, value]) => value === workflowStatus)
    .map(([key]) => key);
}

export enum CourseWorkflowStage {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

export enum ProgramWorkflowStage {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

export enum CohortWorkflowStage {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

export enum OrgUnitWorkflowStage {
  DRAFT = 'DRAFT',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

export const COURSE_WORKFLOW_STAGES: CourseWorkflowStage[] = [
  CourseWorkflowStage.DRAFT,
  CourseWorkflowStage.REVIEWING,
  CourseWorkflowStage.APPROVED,
  CourseWorkflowStage.PUBLISHED,
];

export const PROGRAM_WORKFLOW_STAGES: ProgramWorkflowStage[] = [
  ProgramWorkflowStage.DRAFT,
  ProgramWorkflowStage.REVIEWING,
  ProgramWorkflowStage.APPROVED,
  ProgramWorkflowStage.PUBLISHED,
];

export const COHORT_WORKFLOW_STAGES: CohortWorkflowStage[] = [
  CohortWorkflowStage.DRAFT,
  CohortWorkflowStage.REVIEWING,
  CohortWorkflowStage.APPROVED,
  CohortWorkflowStage.PUBLISHED,
];

export const ORG_UNIT_WORKFLOW_STAGES: OrgUnitWorkflowStage[] = [
  OrgUnitWorkflowStage.DRAFT,
  OrgUnitWorkflowStage.REVIEWING,
  OrgUnitWorkflowStage.APPROVED,
  OrgUnitWorkflowStage.PUBLISHED,
];

export function getCourseWorkflowStageLabel(stage: CourseWorkflowStage | string): string {
  switch ((stage || '').toUpperCase()) {
    case CourseWorkflowStage.DRAFT:
      return 'Giảng viên soạn thảo';
    case CourseWorkflowStage.REVIEWING:
      return 'Khoa xem xét';
    case CourseWorkflowStage.APPROVED:
      return 'Phòng đào tạo phê duyệt';
    case CourseWorkflowStage.PUBLISHED:
      return 'Hội đồng khoa học công bố';
    default:
      return stage || 'Không xác định';
  }
}

export function getProgramWorkflowStageLabel(stage: ProgramWorkflowStage | string): string {
  switch ((stage || '').toUpperCase()) {
    case ProgramWorkflowStage.DRAFT:
      return 'Giảng viên soạn thảo';
    case ProgramWorkflowStage.REVIEWING:
      return 'Khoa xem xét';
    case ProgramWorkflowStage.APPROVED:
      return 'Phòng đào tạo phê duyệt';
    case ProgramWorkflowStage.PUBLISHED:
      return 'Hội đồng khoa học công bố';
    default:
      return stage || 'Không xác định';
  }
}

export function getCohortWorkflowStageLabel(stage: CohortWorkflowStage | string): string {
  switch (stage) {
    case CohortWorkflowStage.DRAFT:
      return 'Soạn thảo';
    case CohortWorkflowStage.REVIEWING:
      return 'Đang xem xét';
    case CohortWorkflowStage.APPROVED:
      return 'Đã phê duyệt';
    case CohortWorkflowStage.PUBLISHED:
      return 'Đã công bố';
    default:
      return stage;
  }
}

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

