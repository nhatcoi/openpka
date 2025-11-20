import {
  WORKFLOW_STATUS_OPTIONS,
  WorkflowStatus,
  getResourceStatusesForWorkflowStatus,
  getWorkflowStatusColor as getWorkflowStatusColorBase,
  getWorkflowStatusLabel as getWorkflowStatusLabelBase,
  normalizeWorkflowStatusFromResource,
  CohortWorkflowStage,
  COHORT_WORKFLOW_STAGES,
  getCohortWorkflowStageLabel,
} from '@/constants/workflow-statuses';

export enum CohortIntakeTerm {
  FALL = 'Fall',
  SPRING = 'Spring',
  SUMMER = 'Summer',
  YEAR_ROUND = 'Year-round',
}

export const COHORT_INTAKE_TERMS: CohortIntakeTerm[] = [
  CohortIntakeTerm.FALL,
  CohortIntakeTerm.SPRING,
  CohortIntakeTerm.SUMMER,
  CohortIntakeTerm.YEAR_ROUND,
];
export const COHORT_WORKFLOW_STATUS_OPTIONS = WORKFLOW_STATUS_OPTIONS;

export const COHORT_DEFAULTS = {
  STATUS: WorkflowStatus.DRAFT,
  INTAKE_TERM: CohortIntakeTerm.FALL,
  IS_ACTIVE: true,
} as const;

export function normalizeCohortWorkflowStatus(status?: string | null): WorkflowStatus {
  return normalizeWorkflowStatusFromResource('cohort', status);
}

export function getRawCohortStatuses(workflowStatus: WorkflowStatus): string[] {
  return getResourceStatusesForWorkflowStatus('cohort', workflowStatus);
}

export function getCohortStatusLabel(status: string): string {
  return getWorkflowStatusLabelBase(normalizeCohortWorkflowStatus(status));
}

export function getCohortStatusColor(status: string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  return getWorkflowStatusColorBase(normalizeCohortWorkflowStatus(status));
}

export function getCohortIntakeTermLabel(term: CohortIntakeTerm | string): string {
  switch (term) {
    case CohortIntakeTerm.FALL:
      return 'Học kỳ 1 (Thu)';
    case CohortIntakeTerm.SPRING:
      return 'Học kỳ 2 (Xuân)';
    case CohortIntakeTerm.SUMMER:
      return 'Học kỳ hè';
    case CohortIntakeTerm.YEAR_ROUND:
      return 'Cả năm';
    default:
      return term;
  }
}

export function getCohortStageFromStatus(status: string): CohortWorkflowStage {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'PLANNING') return CohortWorkflowStage.DRAFT;
  if (normalized === 'RECRUITING') return CohortWorkflowStage.REVIEWING;
  if (normalized === 'ACTIVE') return CohortWorkflowStage.APPROVED;
  if (normalized === 'GRADUATED') return CohortWorkflowStage.PUBLISHED;
  return CohortWorkflowStage.DRAFT;
}

export function computeCohortStepIndex(status: string): number {
  const stage = getCohortStageFromStatus(status);
  switch (stage) {
    case CohortWorkflowStage.DRAFT:
      return 0;
    case CohortWorkflowStage.REVIEWING:
      return 1;
    case CohortWorkflowStage.APPROVED:
      return 2;
    case CohortWorkflowStage.PUBLISHED:
      return 3;
    default:
      return 0;
  }
}

export function generateCohortCode(intakeYear: number, intakeTerm: string, orgUnitCode?: string): string {
  const year = intakeYear.toString().slice(-2);
  const term = intakeTerm.charAt(0).toUpperCase();
  if (orgUnitCode) {
    return `K${year}${term}${orgUnitCode}`;
  }
  return `K${year}${term}`;
}

export function generateCohortName(intakeYear: number, intakeTerm: string): string {
  const termLabel = getCohortIntakeTermLabel(intakeTerm);
  return `Khóa ${intakeYear} - ${termLabel}`;
}

export function getAcademicYear(intakeYear: number): string {
  return `${intakeYear}-${intakeYear + 1}`;
}

export function isValidCohortStatus(status: string): boolean {
  const normalized = normalizeCohortWorkflowStatus(status);
  return Object.values(WorkflowStatus).includes(normalized);
}

export function isValidCohortIntakeTerm(term: string): boolean {
  return COHORT_INTAKE_TERMS.includes(term as CohortIntakeTerm);
}
