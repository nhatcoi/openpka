import {
  WORKFLOW_STATUS_OPTIONS,
  WorkflowStatus,
  getResourceStatusesForWorkflowStatus,
  getWorkflowStatusColor as getWorkflowStatusColorBase,
  getWorkflowStatusLabel as getWorkflowStatusLabelBase,
  normalizeWorkflowStatusFromResource,
  CourseWorkflowStage,
  COURSE_WORKFLOW_STAGES,
  getCourseWorkflowStageLabel,
} from '@/constants/workflow-statuses';

export enum CoursePrerequisiteType {
  PREREQUISITE = 'prerequisite',
  PRIOR = 'prior',
  COREQUISITE = 'corequisite',
}

export { CourseWorkflowStage as WorkflowStage, COURSE_WORKFLOW_STAGES as WORKFLOW_STAGES, getCourseWorkflowStageLabel as getWorkflowStageLabel };

export enum CoursePriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CourseType {
  THEORY = 'theory',
  PRACTICE = 'practice',
  MIXED = 'mixed',
  THESIS = 'thesis',
  INTERNSHIP = 'internship',
}

export const COURSE_WORKFLOW_STATUS_OPTIONS = WORKFLOW_STATUS_OPTIONS;
export const COURSE_PRIORITIES: CoursePriority[] = [
  CoursePriority.HIGH,
  CoursePriority.MEDIUM,
  CoursePriority.LOW,
];
export const COURSE_TYPES: CourseType[] = [
  CourseType.THEORY,
  CourseType.PRACTICE,
  CourseType.MIXED,
  CourseType.THESIS,
  CourseType.INTERNSHIP,
];

export function normalizeCourseWorkflowStatus(status?: string | null): WorkflowStatus {
  return normalizeWorkflowStatusFromResource('course', status);
}

export function getRawCourseStatuses(workflowStatus: WorkflowStatus): string[] {
  return getResourceStatusesForWorkflowStatus('course', workflowStatus);
}

export function getStatusLabel(status: string): string {
  return getWorkflowStatusLabelBase(normalizeCourseWorkflowStatus(status));
}

export function getStatusColor(status: string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  return getWorkflowStatusColorBase(normalizeCourseWorkflowStatus(status));
}

export function normalizeCoursePriority(priority?: string | null): CoursePriority {
  switch ((priority || '').toUpperCase()) {
    case CoursePriority.HIGH:
      return CoursePriority.HIGH;
    case CoursePriority.LOW:
      return CoursePriority.LOW;
    case CoursePriority.MEDIUM:
    default:
      return CoursePriority.MEDIUM;
  }
}

export function getPriorityLabel(priority: CoursePriority | string): string {
  switch ((priority || '').toUpperCase()) {
    case CoursePriority.HIGH:
      return 'Cao';
    case CoursePriority.LOW:
      return 'Thấp';
    case CoursePriority.MEDIUM:
    default:
      return 'Trung bình';
  }
}

export function getPrereqLabelVi(type: string): string {
  switch (type) {
    case CoursePrerequisiteType.PREREQUISITE:
      return 'Bắt buộc';
    case CoursePrerequisiteType.PRIOR:
      return 'Khuyến nghị';
    case CoursePrerequisiteType.COREQUISITE:
      return 'Song hành';
    default:
      return type;
  }
}

export function getPrereqChipColor(type: string): 'error' | 'warning' | 'info' | 'default' {
  switch (type) {
    case CoursePrerequisiteType.PREREQUISITE:
      return 'error';
    case CoursePrerequisiteType.PRIOR:
      return 'warning';
    case CoursePrerequisiteType.COREQUISITE:
      return 'info';
    default:
      return 'default';
  }
}

export function getCourseTypeLabel(type: CourseType | string): string {
  switch (type) {
    case CourseType.THEORY:
      return 'Lý thuyết';
    case CourseType.PRACTICE:
      return 'Thực hành';
    case CourseType.MIXED:
      return 'Lý thuyết + Thực hành';
    case CourseType.THESIS:
      return 'Khóa luận/Đồ án';
    case CourseType.INTERNSHIP:
      return 'Thực tập';
    default:
      return type;
  }
}

export function getCourseStageFromStatus(status?: string | null): CourseWorkflowStage {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'DRAFT') return CourseWorkflowStage.FACULTY;
  if (normalized === 'SUBMITTED' || normalized === 'REVIEWING') return CourseWorkflowStage.ACADEMIC_OFFICE;
  if (normalized === 'APPROVED') return CourseWorkflowStage.ACADEMIC_OFFICE;
  if (normalized === 'PUBLISHED') return CourseWorkflowStage.ACADEMIC_BOARD;
  if (normalized === 'REJECTED') return CourseWorkflowStage.ACADEMIC_OFFICE;
  return CourseWorkflowStage.FACULTY;
}

export function computeCourseStepIndex(status: string): number {
  const stage = getCourseStageFromStatus(status);
  const index = COURSE_WORKFLOW_STAGES.indexOf(stage);
  return index >= 0 ? index : 0;
}
