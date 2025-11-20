import {
  WORKFLOW_STATUS_OPTIONS,
  WorkflowStatus,
  getWorkflowStatusColor as getWorkflowStatusColorBase,
  getWorkflowStatusLabel as getWorkflowStatusLabelBase,
  normalizeWorkflowStatusFromResource,
} from '@/constants/workflow-statuses';

export enum MajorDegreeLevel {
  BACHELOR = 'Bachelor',
  MASTER = 'Master',
  PHD = 'PhD',
  DIPLOMA = 'Diploma',
  ASSOCIATE = 'Associate',
  CERTIFICATE = 'Certificate',
  POSTGRADUATE = 'Postgraduate',
}

export enum MajorSpecializationModel {
  NONE = 'none',
  TRACK = 'track',
  CONCENTRATION = 'concentration',
  MINOR = 'minor',
}

export enum MajorFieldCluster {
  CNTT = 'CNTT',
  KINH_TE = 'Kinh tế',
  NATURAL_SCIENCES = 'Natural Sciences',
  ENGINEERING = 'Engineering',
  SOCIAL_SCIENCES = 'Social Sciences',
  HUMANITIES = 'Humanities',
  BUSINESS = 'Business',
  HEALTH_SCIENCES = 'Health Sciences',
  ARTS = 'Arts',
  EDUCATION = 'Education',
  LAW = 'Law',
  AGRICULTURE = 'Agriculture',
  OTHER = 'Other',
}

export enum MajorStartTerm {
  FALL = 'Fall',
  SPRING = 'Spring',
  SUMMER = 'Summer',
  YEAR_ROUND = 'Year-round',
}

export enum MajorWorkflowAction {
  SUBMIT = 'submit',
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_EDIT = 'request_edit',
  PUBLISH = 'publish',
  SCIENCE_COUNCIL_PUBLISH = 'science_council_publish',
  DELETE = 'delete',
}

export const MAJOR_WORKFLOW_STATUS_OPTIONS = WORKFLOW_STATUS_OPTIONS;
export const MAJOR_DEGREE_LEVELS: MajorDegreeLevel[] = [
  MajorDegreeLevel.BACHELOR,
  MajorDegreeLevel.MASTER,
  MajorDegreeLevel.PHD,
  MajorDegreeLevel.DIPLOMA,
  MajorDegreeLevel.ASSOCIATE,
  MajorDegreeLevel.CERTIFICATE,
  MajorDegreeLevel.POSTGRADUATE,
];
export const MAJOR_SPECIALIZATION_MODELS: MajorSpecializationModel[] = [
  MajorSpecializationModel.NONE,
  MajorSpecializationModel.TRACK,
  MajorSpecializationModel.CONCENTRATION,
  MajorSpecializationModel.MINOR,
];
export const MAJOR_FIELD_CLUSTERS: MajorFieldCluster[] = [
  MajorFieldCluster.CNTT,
  MajorFieldCluster.KINH_TE,
  MajorFieldCluster.NATURAL_SCIENCES,
  MajorFieldCluster.ENGINEERING,
  MajorFieldCluster.SOCIAL_SCIENCES,
  MajorFieldCluster.HUMANITIES,
  MajorFieldCluster.BUSINESS,
  MajorFieldCluster.HEALTH_SCIENCES,
  MajorFieldCluster.ARTS,
  MajorFieldCluster.EDUCATION,
  MajorFieldCluster.LAW,
  MajorFieldCluster.AGRICULTURE,
  MajorFieldCluster.OTHER,
];
export const MAJOR_START_TERMS: MajorStartTerm[] = [
  MajorStartTerm.FALL,
  MajorStartTerm.SPRING,
  MajorStartTerm.SUMMER,
  MajorStartTerm.YEAR_ROUND,
];
export const MAJOR_WORKFLOW_ACTIONS: MajorWorkflowAction[] = [
  MajorWorkflowAction.SUBMIT,
  MajorWorkflowAction.REVIEW,
  MajorWorkflowAction.APPROVE,
  MajorWorkflowAction.REJECT,
  MajorWorkflowAction.REQUEST_EDIT,
  MajorWorkflowAction.PUBLISH,
  MajorWorkflowAction.SCIENCE_COUNCIL_PUBLISH,
  MajorWorkflowAction.DELETE,
];

export const MAJOR_PERMISSIONS = {
  VIEW: 'tms.major.view',
  CREATE: 'tms.major.create',
  UPDATE: 'tms.major.update',
  DELETE: 'tms.major.delete',
  APPROVE: 'tms.major.approve',
  PUBLISH: 'tms.major.publish',
  READ: 'tms.major.view',
  WRITE: 'tms.major.create',
  MANAGE: 'tms.major.view',
  REVIEW: 'tms.major.approve',
  REJECT: 'tms.major.approve',
  REQUEST_EDIT: 'tms.major.write',
  SCIENCE_COUNCIL_PUBLISH: 'tms.major.approve',
} as const;

export const MAJOR_DEFAULTS = {
  STATUS: WorkflowStatus.APPROVED,
  DEGREE_LEVEL: MajorDegreeLevel.BACHELOR,
  SPECIALIZATION_MODEL: MajorSpecializationModel.NONE,
  DURATION_YEARS: 4.0,
  SEMESTERS_PER_YEAR: 2,
  START_TERM: MajorStartTerm.FALL,
  IS_MOET_STANDARD: false,
} as const;

export function normalizeMajorWorkflowStatus(status?: string | null): WorkflowStatus {
  return normalizeWorkflowStatusFromResource('major', status);
}

export function getMajorStatusLabel(status: string): string {
  return getWorkflowStatusLabelBase(normalizeMajorWorkflowStatus(status));
}

export function getMajorStatusColor(status: string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  return getWorkflowStatusColorBase(normalizeMajorWorkflowStatus(status));
}

export function normalizeMajorDegreeLevel(level?: string | null): MajorDegreeLevel {
  switch ((level || '').toLowerCase()) {
    case 'bachelor':
      return MajorDegreeLevel.BACHELOR;
    case 'master':
      return MajorDegreeLevel.MASTER;
    case 'phd':
      return MajorDegreeLevel.PHD;
    case 'diploma':
      return MajorDegreeLevel.DIPLOMA;
    case 'associate':
      return MajorDegreeLevel.ASSOCIATE;
    case 'certificate':
      return MajorDegreeLevel.CERTIFICATE;
    case 'postgraduate':
      return MajorDegreeLevel.POSTGRADUATE;
    default:
      return MajorDegreeLevel.BACHELOR;
  }
}

export function getMajorDegreeLevelLabel(level: MajorDegreeLevel | string): string {
  switch (level) {
    case MajorDegreeLevel.BACHELOR:
      return 'Cử nhân';
    case MajorDegreeLevel.MASTER:
      return 'Thạc sĩ';
    case MajorDegreeLevel.PHD:
      return 'Tiến sĩ';
    case MajorDegreeLevel.DIPLOMA:
      return 'Văn bằng';
    case MajorDegreeLevel.ASSOCIATE:
      return 'Cao đẳng';
    case MajorDegreeLevel.CERTIFICATE:
      return 'Chứng chỉ';
    case MajorDegreeLevel.POSTGRADUATE:
      return 'Sau đại học';
    default:
      return level;
  }
}

export function getMajorDegreeLevelColor(level: MajorDegreeLevel | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (level) {
    case MajorDegreeLevel.PHD:
      return 'error';
    case MajorDegreeLevel.MASTER:
    case MajorDegreeLevel.POSTGRADUATE:
      return 'warning';
    case MajorDegreeLevel.BACHELOR:
      return 'success';
    case MajorDegreeLevel.DIPLOMA:
    case MajorDegreeLevel.ASSOCIATE:
      return 'info';
    case MajorDegreeLevel.CERTIFICATE:
      return 'default';
    default:
      return 'default';
  }
}

export function getMajorSpecializationModelLabel(model: MajorSpecializationModel | string): string {
  switch (model) {
    case MajorSpecializationModel.NONE:
      return 'Không chuyên sâu';
    case MajorSpecializationModel.TRACK:
      return 'Định hướng';
    case MajorSpecializationModel.CONCENTRATION:
      return 'Chuyên ngành';
    case MajorSpecializationModel.MINOR:
      return 'Ngành phụ';
    default:
      return model;
  }
}

export function getMajorFieldClusterLabel(cluster: MajorFieldCluster | string): string {
  switch (cluster) {
    case MajorFieldCluster.CNTT:
      return 'Công nghệ thông tin';
    case MajorFieldCluster.KINH_TE:
      return 'Kinh tế';
    case MajorFieldCluster.NATURAL_SCIENCES:
      return 'Khoa học tự nhiên';
    case MajorFieldCluster.ENGINEERING:
      return 'Kỹ thuật';
    case MajorFieldCluster.SOCIAL_SCIENCES:
      return 'Khoa học xã hội';
    case MajorFieldCluster.HUMANITIES:
      return 'Nhân văn';
    case MajorFieldCluster.BUSINESS:
      return 'Kinh doanh';
    case MajorFieldCluster.HEALTH_SCIENCES:
      return 'Khoa học sức khỏe';
    case MajorFieldCluster.ARTS:
      return 'Nghệ thuật';
    case MajorFieldCluster.EDUCATION:
      return 'Giáo dục';
    case MajorFieldCluster.LAW:
      return 'Luật';
    case MajorFieldCluster.AGRICULTURE:
      return 'Nông nghiệp';
    case MajorFieldCluster.OTHER:
      return 'Khác';
    default:
      return cluster;
  }
}

export function getMajorStartTermLabel(term: MajorStartTerm | string): string {
  switch (term) {
    case MajorStartTerm.FALL:
      return 'Học kỳ 1 (Thu)';
    case MajorStartTerm.SPRING:
      return 'Học kỳ 2 (Xuân)';
    case MajorStartTerm.SUMMER:
      return 'Học kỳ hè';
    case MajorStartTerm.YEAR_ROUND:
      return 'Cả năm';
    default:
      return term;
  }
}

export function getMajorActionCopy(action: MajorWorkflowAction | string): { title: string; description: string; success: string } {
  switch (action) {
    case MajorWorkflowAction.SUBMIT:
      return {
        title: 'Gửi xem xét',
        description: 'Gửi ngành đào tạo lên Phòng Đào tạo để xem xét phê duyệt.',
        success: 'Đã gửi ngành đào tạo để xem xét.',
      };
    case MajorWorkflowAction.APPROVE:
      return {
        title: 'Phê duyệt',
        description: 'Phê duyệt ngành đào tạo này.',
        success: 'Đã phê duyệt ngành đào tạo.',
      };
    case MajorWorkflowAction.REJECT:
      return {
        title: 'Từ chối',
        description: 'Từ chối ngành đào tạo này.',
        success: 'Đã từ chối ngành đào tạo.',
      };
    case MajorWorkflowAction.REQUEST_EDIT:
      return {
        title: 'Yêu cầu chỉnh sửa',
        description: 'Yêu cầu chỉnh sửa ngành đào tạo này.',
        success: 'Đã yêu cầu chỉnh sửa ngành đào tạo.',
      };
    case MajorWorkflowAction.PUBLISH:
      return {
        title: 'Công bố',
        description: 'Công bố ngành đào tạo này.',
        success: 'Đã công bố ngành đào tạo.',
      };
    case MajorWorkflowAction.SCIENCE_COUNCIL_PUBLISH:
      return {
        title: 'Hội đồng khoa học công bố',
        description: 'Hội đồng khoa học công bố ngành đào tạo này.',
        success: 'Đã công bố ngành đào tạo qua Hội đồng khoa học.',
      };
    case MajorWorkflowAction.DELETE:
      return {
        title: 'Xóa',
        description: 'Xóa ngành đào tạo này.',
        success: 'Đã xóa ngành đào tạo.',
      };
    default:
      return {
        title: 'Thao tác',
        description: 'Thực hiện thao tác này.',
        success: 'Thao tác thành công.',
      };
  }
}

export function formatMajorDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMajorDuration(duration?: number | string | null): string {
  if (!duration) return 'Chưa xác định';
  const num = typeof duration === 'string' ? parseFloat(duration) : duration;
  if (num === 1) return '1 năm';
  if (num < 1) return `${num} năm`;
  return `${num} năm`;
}

export function formatMajorCredits(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Chưa xác định';
  if (min === max) return `${min} tín chỉ`;
  if (!min) return `≤ ${max} tín chỉ`;
  if (!max) return `≥ ${min} tín chỉ`;
  return `${min} - ${max} tín chỉ`;
}
