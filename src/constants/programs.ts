import {
  WORKFLOW_STATUS_OPTIONS,
  WorkflowStatus,
  getWorkflowStatusColor as getWorkflowStatusColorBase,
  getWorkflowStatusLabel as getWorkflowStatusLabelBase,
  normalizeWorkflowStatusFromResource,
  ProgramWorkflowStage,
  PROGRAM_WORKFLOW_STAGES,
  getProgramWorkflowStageLabel,
} from '@/constants/workflow-statuses';

export enum ProgramPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ProgramWorkflowAction {
  SUBMIT = 'submit',
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  PUBLISH = 'publish',
  DELETE = 'delete',
  REQUEST_EDIT = 'request_edit',
  SCIENCE_COUNCIL_PUBLISH = 'science_council_publish',
}

export enum ProgramBlockType {
  GENERAL = 'general',
  FOUNDATION = 'foundation',
  CORE = 'core',
  MAJOR = 'major',
  ELECTIVE = 'elective',
  THESIS = 'thesis',
  INTERNSHIP = 'internship',
  OTHER = 'other',
}

export enum ProgramBlockTemplateType {
  REQUIRED = 'REQUIRED',
  ELECTIVE = 'ELECTIVE',
  THESIS = 'THESIS',
  INTERNSHIP = 'INTERNSHIP',
  GENERAL = 'GENERAL',
  FOUNDATION = 'FOUNDATION',
  MAJOR = 'MAJOR',
}

export enum ProgramBlockTemplateGroupType {
  MANDATORY = 'MANDATORY',
  OPTIONAL = 'OPTIONAL',
  CHOOSE_N_FROM = 'CHOOSE_N_FROM',
}

export enum BlockTemplateCategoryCode {
  GENERAL = 'GENERAL',
  FOUNDATION = 'FOUNDATION',
  MAJOR = 'MAJOR',
  THESIS = 'THESIS',
  ELECTIVE = 'ELECTIVE',
}

export enum ProgramDegreeLevel {
  BACHELOR = 'bachelor',
  MASTER = 'master',
  PHD = 'phd',
  DIPLOMA = 'diploma',
  ASSOCIATE = 'associate',
  CERTIFICATE = 'certificate',
}

export const PROGRAM_BLOCK_GROUP_TYPES = ['required', 'elective', 'core', 'other'] as const;
export type ProgramBlockGroupType = (typeof PROGRAM_BLOCK_GROUP_TYPES)[number];

export const PROGRAM_WORKFLOW_STATUS_OPTIONS = WORKFLOW_STATUS_OPTIONS;
export const PROGRAM_PRIORITIES: ProgramPriority[] = [
  ProgramPriority.HIGH,
  ProgramPriority.MEDIUM,
  ProgramPriority.LOW,
];
export const PROGRAM_BLOCK_TYPES: ProgramBlockType[] = [
  ProgramBlockType.GENERAL,
  ProgramBlockType.FOUNDATION,
  ProgramBlockType.CORE,
  ProgramBlockType.MAJOR,
  ProgramBlockType.ELECTIVE,
  ProgramBlockType.THESIS,
  ProgramBlockType.INTERNSHIP,
  ProgramBlockType.OTHER,
];
export const PROGRAM_DEGREE_LEVELS: ProgramDegreeLevel[] = [
  ProgramDegreeLevel.BACHELOR,
  ProgramDegreeLevel.MASTER,
  ProgramDegreeLevel.PHD,
  ProgramDegreeLevel.DIPLOMA,
  ProgramDegreeLevel.ASSOCIATE,
  ProgramDegreeLevel.CERTIFICATE,
];
export const PROGRAM_WORKFLOW_ACTIONS: ProgramWorkflowAction[] = [
  ProgramWorkflowAction.SUBMIT,
  ProgramWorkflowAction.REVIEW,
  ProgramWorkflowAction.APPROVE,
  ProgramWorkflowAction.REJECT,
  ProgramWorkflowAction.PUBLISH,
  ProgramWorkflowAction.DELETE,
  ProgramWorkflowAction.REQUEST_EDIT,
  ProgramWorkflowAction.SCIENCE_COUNCIL_PUBLISH,
];

export const PROGRAM_PERMISSIONS = {
  VIEW: 'tms.program.view',
  CREATE: 'tms.program.create',
  UPDATE: 'tms.program.update',
  DELETE: 'tms.program.delete',
  APPROVE: 'tms.program.approve',
  PUBLISH: 'tms.program.publish',
  READ: 'tms.program.view',
  WRITE: 'tms.program.create',
  SUBMIT: 'tms.program.create',
  REVIEW: 'tms.program.approve',
  REJECT: 'tms.program.approve',
  REQUEST_EDIT: 'tms.program.write',
  SCIENCE_COUNCIL_PUBLISH: 'tms.program.approve',
  MANAGE: 'tms.program.write',
} as const;

export const PROGRAM_STAGE_CHIP_COLORS: Record<ProgramWorkflowStage, 'default' | 'info' | 'success' | 'warning'> = {
  [ProgramWorkflowStage.DRAFT]: 'default',
  [ProgramWorkflowStage.REVIEWING]: 'info',
  [ProgramWorkflowStage.APPROVED]: 'success',
  [ProgramWorkflowStage.PUBLISHED]: 'success',
};

export const DEFAULT_PROGRAM_PAGE_SIZE = 10;
export const DEFAULT_PROGRAM_STATS = {
  pending: 0,
  reviewing: 0,
  approved: 0,
  rejected: 0,
  total: 0,
} as const;

export function normalizeProgramWorkflowStatus(status?: string | null): WorkflowStatus {
  return normalizeWorkflowStatusFromResource('program', status);
}

export function getProgramStatusLabel(status: string): string {
  return getWorkflowStatusLabelBase(normalizeProgramWorkflowStatus(status));
}

export function getProgramStatusColor(status: string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  return getWorkflowStatusColorBase(normalizeProgramWorkflowStatus(status));
}

export function normalizeProgramPriority(priority?: string | null): ProgramPriority {
  switch ((priority || '').toUpperCase()) {
    case ProgramPriority.HIGH:
      return ProgramPriority.HIGH;
    case ProgramPriority.LOW:
      return ProgramPriority.LOW;
    case ProgramPriority.MEDIUM:
    default:
      return ProgramPriority.MEDIUM;
  }
}

export function getProgramPriorityLabel(priority: ProgramPriority | string): string {
  switch ((priority || '').toUpperCase()) {
    case ProgramPriority.HIGH:
      return 'Cao';
    case ProgramPriority.LOW:
      return 'Thấp';
    case ProgramPriority.MEDIUM:
    default:
      return 'Trung bình';
  }
}

export function getProgramPriorityColor(priority: ProgramPriority | string): 'error' | 'warning' | 'success' | 'default' {
  switch ((priority || '').toUpperCase()) {
    case ProgramPriority.HIGH:
      return 'error';
    case ProgramPriority.MEDIUM:
      return 'warning';
    case ProgramPriority.LOW:
      return 'success';
    default:
      return 'default';
  }
}

export function getProgramDegreeLabel(level: ProgramDegreeLevel | string | null | undefined): string {
  switch ((level || '').toLowerCase()) {
    case ProgramDegreeLevel.BACHELOR:
      return 'Cử nhân';
    case ProgramDegreeLevel.MASTER:
      return 'Thạc sĩ';
    case ProgramDegreeLevel.PHD:
      return 'Tiến sĩ';
    case ProgramDegreeLevel.DIPLOMA:
      return 'Cao đẳng';
    case ProgramDegreeLevel.ASSOCIATE:
      return 'Trung cấp';
    case ProgramDegreeLevel.CERTIFICATE:
      return 'Chứng chỉ';
    default:
      return level || 'Không xác định';
  }
}

export function getProgramBlockTypeLabel(type: ProgramBlockType | string): string {
  switch ((type || '').toLowerCase()) {
    case ProgramBlockType.GENERAL:
      return 'Kiến thức đại cương';
    case ProgramBlockType.FOUNDATION:
      return 'Cơ sở ngành';
    case ProgramBlockType.CORE:
      return 'Bắt buộc cơ bản';
    case ProgramBlockType.MAJOR:
      return 'Chuyên ngành';
    case ProgramBlockType.ELECTIVE:
      return 'Tự chọn';
    case ProgramBlockType.THESIS:
      return 'Đồ án/Khóa luận';
    case ProgramBlockType.INTERNSHIP:
      return 'Thực tập';
    case ProgramBlockType.OTHER:
      return 'Khối khác';
    default:
      return type || 'Không xác định';
  }
}

export function normalizeProgramBlockType(type?: string | null): ProgramBlockType {
  const value = (type || '').toLowerCase();
  if ((PROGRAM_BLOCK_TYPES as string[]).includes(value)) {
    return value as ProgramBlockType;
  }
  return ProgramBlockType.CORE;
}

export function normalizeProgramBlockTypeForDb(type?: string | null): string {
  return normalizeProgramBlockType(type).toUpperCase();
}

export function getProgramBlockGroupBaseType(type?: string | null): ProgramBlockGroupType {
  const value = (type || '').toLowerCase();
  if (value.startsWith('elective')) return 'elective';
  if (value.startsWith('required')) return 'required';
  if (value.startsWith('core')) return 'core';
  return 'other';
}

export function getProgramBlockGroupTypeLabel(type: ProgramBlockGroupType | string): string {
  const base = getProgramBlockGroupBaseType(type);
  switch (base) {
    case 'required':
      return 'Các học phần bắt buộc';
    case 'elective':
      return 'Các học phần tự chọn';
    case 'core':
      return 'Các học phần chính';
    default:
      return 'Nhóm học phần khác';
  }
}

export function normalizeProgramBlockGroupType(type?: string | null): string {
  return (type ?? 'OTHER').toString().trim().toUpperCase();
}

export function getProgramStageFromStatus(status?: string | null): ProgramWorkflowStage {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'DRAFT') return ProgramWorkflowStage.DRAFT;
  if (normalized === 'SUBMITTED' || normalized === 'REVIEWING') return ProgramWorkflowStage.REVIEWING;
  if (normalized === 'APPROVED') return ProgramWorkflowStage.APPROVED;
  if (normalized === 'PUBLISHED') return ProgramWorkflowStage.PUBLISHED;
  if (normalized === 'REJECTED') return ProgramWorkflowStage.REVIEWING;
  return ProgramWorkflowStage.DRAFT;
}

export function getProgramStageChipColor(stage: ProgramWorkflowStage): 'default' | 'info' | 'success' | 'warning' {
  return PROGRAM_STAGE_CHIP_COLORS[stage];
}

export function computeProgramStepIndex(status: string): number {
  const stage = getProgramStageFromStatus(status);
  const index = PROGRAM_WORKFLOW_STAGES.indexOf(stage);
  return index >= 0 ? index : 0;
}

export function formatProgramDateTime(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return value;
  }
}

export interface ProgramActionCopy {
  title: string;
  description: string;
  success?: string;
}

export const PROGRAM_ACTION_COPY: Record<ProgramWorkflowAction, ProgramActionCopy> = {
  [ProgramWorkflowAction.SUBMIT]: {
    title: 'Gửi phê duyệt',
    description: 'Bạn muốn gửi chương trình đào tạo này vào quy trình phê duyệt?',
    success: 'Đã gửi chương trình vào quy trình phê duyệt.',
  },
  [ProgramWorkflowAction.REVIEW]: {
    title: 'Tiếp nhận chương trình',
    description: 'Bạn xác nhận tiếp nhận và chuyển chương trình sang trạng thái Đang xem xét?',
    success: 'Đã chuyển sang trạng thái Đang xem xét.',
  },
  [ProgramWorkflowAction.APPROVE]: {
    title: 'Phê duyệt chương trình',
    description: 'Bạn muốn phê duyệt chương trình đào tạo này?',
    success: 'Chương trình đã được phê duyệt.',
  },
  [ProgramWorkflowAction.REJECT]: {
    title: 'Từ chối chương trình',
    description: 'Bạn muốn từ chối chương trình đào tạo này?',
    success: 'Đã từ chối chương trình.',
  },
  [ProgramWorkflowAction.PUBLISH]: {
    title: 'Xuất bản chương trình',
    description: 'Bạn muốn xuất bản chương trình đào tạo này?',
    success: 'Chương trình đã được xuất bản.',
  },
  [ProgramWorkflowAction.DELETE]: {
    title: 'Xóa chương trình',
    description: 'Bạn có chắc chắn muốn xóa chương trình đào tạo này? Hành động này không thể hoàn tác.',
    success: 'Chương trình đã được xóa.',
  },
  [ProgramWorkflowAction.REQUEST_EDIT]: {
    title: 'Yêu cầu chỉnh sửa',
    description: 'Bạn muốn yêu cầu chỉnh sửa chương trình đào tạo này?',
    success: 'Đã gửi yêu cầu chỉnh sửa.',
  },
  [ProgramWorkflowAction.SCIENCE_COUNCIL_PUBLISH]: {
    title: 'Hội đồng khoa học công bố',
    description: 'Bạn muốn Hội đồng khoa học công bố chương trình đào tạo này?',
    success: 'Chương trình đã được Hội đồng khoa học công bố.',
  },
};

export function getProgramActionCopy(action: ProgramWorkflowAction): ProgramActionCopy {
  return PROGRAM_ACTION_COPY[action];
}

export interface ProgramStatsSummary {
  pending: number;
  reviewing: number;
  approved: number;
  rejected: number;
  total: number;
}
