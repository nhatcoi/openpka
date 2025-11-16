// Major-related enums and helpers

export enum MajorStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  PROPOSED = 'PROPOSED',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

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

export const MAJOR_PERMISSIONS = {
  // New permissions structure
  VIEW: 'tms.major.view',
  CREATE: 'tms.major.create',
  UPDATE: 'tms.major.update',
  DELETE: 'tms.major.delete',
  APPROVE: 'tms.major.approve',
  PUBLISH: 'tms.major.publish',
  // Legacy aliases for backward compatibility
  READ: 'tms.major.view',
  WRITE: 'tms.major.create', // Use CREATE for write operations
  MANAGE: 'tms.major.view', // Use VIEW for manage
  // Removed: REJECT, REQUEST_EDIT, SCIENCE_COUNCIL_PUBLISH (use APPROVE/PUBLISH instead)
  REVIEW: 'tms.major.approve', // Alias for APPROVE
  REJECT: 'tms.major.approve', // Alias for APPROVE
  REQUEST_EDIT: 'tms.major.write', // Alias for WRITE
  SCIENCE_COUNCIL_PUBLISH: 'tms.major.approve', // Alias for APPROVE
} as const;

// Major workflow actions
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

// Major workflow stages
export enum MajorWorkflowStage {
  DRAFT = 'DRAFT',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  PUBLISHED = 'published',
}

// Major status arrays
export const MAJOR_STATUSES: MajorStatus[] = [
  MajorStatus.DRAFT,
  MajorStatus.REVIEWING,
  MajorStatus.APPROVED,
  MajorStatus.REJECTED,
  MajorStatus.PUBLISHED,
  MajorStatus.ACTIVE,
  MajorStatus.SUSPENDED,
  MajorStatus.CLOSED,
  MajorStatus.ARCHIVED,
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

export const MAJOR_WORKFLOW_STAGES: MajorWorkflowStage[] = [
  MajorWorkflowStage.DRAFT,
  MajorWorkflowStage.REVIEWING,
  MajorWorkflowStage.APPROVED,
  MajorWorkflowStage.PUBLISHED,
];

// Helper functions for status
export function getMajorStatusColor(status: MajorStatus | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case MajorStatus.ACTIVE:
    case MajorStatus.APPROVED:
      return 'success';
    case MajorStatus.DRAFT:
      return 'default';
    case MajorStatus.PROPOSED:
    case MajorStatus.REVIEWING:
      return 'info';
    case MajorStatus.SUSPENDED:
      return 'warning';
    case MajorStatus.CLOSED:
    case MajorStatus.ARCHIVED:
    case MajorStatus.REJECTED:
      return 'error';
    case MajorStatus.PUBLISHED:
      return 'success';
    default:
      return 'default';
  }
}

export function getMajorStatusLabel(status: MajorStatus | string): string {
  switch (status) {
    case MajorStatus.ACTIVE:
      return 'Đang hoạt động';
    case MajorStatus.DRAFT:
      return 'Bản nháp';
    case MajorStatus.PROPOSED:
      return 'Đề xuất';
    case MajorStatus.SUSPENDED:
      return 'Tạm dừng';
    case MajorStatus.CLOSED:
      return 'Đã đóng';
    case MajorStatus.ARCHIVED:
      return 'Đã lưu trữ';
    case MajorStatus.REVIEWING:
      return 'Đang xem xét';
    case MajorStatus.APPROVED:
      return 'Đã phê duyệt';
    case MajorStatus.REJECTED:
      return 'Bị từ chối';
    case MajorStatus.PUBLISHED:
      return 'Đã công bố';
    default:
      return status;
  }
}

export function getMajorWorkflowStageLabel(stage: MajorWorkflowStage | string): string {
  switch (stage) {
    case MajorWorkflowStage.DRAFT:
      return 'Giảng viên soạn thảo';
    case MajorWorkflowStage.REVIEWING:
      return 'Khoa gửi PĐT xem xét';
    case MajorWorkflowStage.APPROVED:
      return 'Phòng Đào Tạo phê duyệt';
    case MajorWorkflowStage.PUBLISHED:
      return 'Hội đồng khoa học công bố';
    default:
      return stage;
  }
}

export function getMajorStageFromStatus(status: MajorStatus | string): MajorWorkflowStage {
  switch (status) {
    case MajorStatus.DRAFT:
      return MajorWorkflowStage.DRAFT;
    case MajorStatus.REVIEWING:
      return MajorWorkflowStage.REVIEWING;
    case MajorStatus.APPROVED:
      return MajorWorkflowStage.APPROVED;
    case MajorStatus.PUBLISHED:
      return MajorWorkflowStage.PUBLISHED;
    default:
      return MajorWorkflowStage.DRAFT;
  }
}

export function getMajorStageChipColor(stage: MajorWorkflowStage | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (stage) {
    case MajorWorkflowStage.DRAFT:
      return 'default';
    case MajorWorkflowStage.REVIEWING:
      return 'info';
    case MajorWorkflowStage.APPROVED:
      return 'success';
    case MajorWorkflowStage.PUBLISHED:
      return 'success';
    default:
      return 'default';
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

export function computeMajorStepIndex(status: MajorStatus | string): number {
  switch (status) {
    case MajorStatus.DRAFT:
      return 0;
    case MajorStatus.REVIEWING:
      return 1;
    case MajorStatus.APPROVED:
      return 2;
    case MajorStatus.PUBLISHED:
      return 3;
    default:
      return 0;
  }
}


// Helper functions for degree level
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

// Helper functions for specialization model
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

// Helper functions for field cluster
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

// Helper functions for start term
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

// Utility functions
export function normalizeMajorStatus(status?: string | null): MajorStatus {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return MajorStatus.ACTIVE;
    case 'draft':
      return MajorStatus.DRAFT;
    case 'proposed':
      return MajorStatus.PROPOSED;
    case 'suspended':
      return MajorStatus.SUSPENDED;
    case 'closed':
      return MajorStatus.CLOSED;
    case 'archived':
      return MajorStatus.ARCHIVED;
    case 'reviewing':
      return MajorStatus.REVIEWING;
    case 'approved':
      return MajorStatus.APPROVED;
    case 'rejected':
      return MajorStatus.REJECTED;
    case 'published':
      return MajorStatus.PUBLISHED;
    default:
      return MajorStatus.ACTIVE;
  }
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

// Validation helpers
export function isValidMajorStatus(status: string): boolean {
  return MAJOR_STATUSES.includes(status as MajorStatus);
}

export function isValidMajorDegreeLevel(level: string): boolean {
  return MAJOR_DEGREE_LEVELS.includes(level as MajorDegreeLevel);
}

export function isValidMajorSpecializationModel(model: string): boolean {
  return MAJOR_SPECIALIZATION_MODELS.includes(model as MajorSpecializationModel);
}

// Default values
export const MAJOR_DEFAULTS = {
  STATUS: MajorStatus.ACTIVE,
  DEGREE_LEVEL: MajorDegreeLevel.BACHELOR,
  SPECIALIZATION_MODEL: MajorSpecializationModel.NONE,
  DURATION_YEARS: 4.0,
  SEMESTERS_PER_YEAR: 2,
  START_TERM: MajorStartTerm.FALL,
  IS_MOET_STANDARD: false,
} as const;
