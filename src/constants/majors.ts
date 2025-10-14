// Major-related enums and helpers

export enum MajorStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
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

export const MAJOR_STATUSES: MajorStatus[] = [
  MajorStatus.ACTIVE,
  MajorStatus.DRAFT,
  MajorStatus.PROPOSED,
  MajorStatus.SUSPENDED,
  MajorStatus.CLOSED,
  MajorStatus.ARCHIVED,
];

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
  VIEW: 'tms.major.view',
  CREATE: 'tms.major.create',
  UPDATE: 'tms.major.update',
  DELETE: 'tms.major.delete',
  MANAGE: 'tms.major.manage',
  APPROVE: 'tms.major.approve',
  PUBLISH: 'tms.major.publish',
} as const;

// Helper functions for status
export function getMajorStatusColor(status: MajorStatus | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case MajorStatus.ACTIVE:
      return 'success';
    case MajorStatus.DRAFT:
      return 'default';
    case MajorStatus.PROPOSED:
      return 'info';
    case MajorStatus.SUSPENDED:
      return 'warning';
    case MajorStatus.CLOSED:
    case MajorStatus.ARCHIVED:
      return 'error';
    default:
      return 'default';
  }
}

export function getMajorStatusLabel(status: MajorStatus | string): string {
  switch (status) {
    case MajorStatus.ACTIVE:
      return 'Hoạt động';
    case MajorStatus.DRAFT:
      return 'Bản nháp';
    case MajorStatus.PROPOSED:
      return 'Đề xuất';
    case MajorStatus.SUSPENDED:
      return 'Tạm dừng';
    case MajorStatus.CLOSED:
      return 'Đóng';
    case MajorStatus.ARCHIVED:
      return 'Lưu trữ';
    default:
      return status;
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
