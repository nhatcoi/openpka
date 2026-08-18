export const TRAINING_TYPES = [
  'technical',
  'soft_skills',
  'leadership',
  'compliance',
  'safety',
  'other',
] as const;

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  technical: 'Kỹ thuật',
  soft_skills: 'Kỹ năng mềm',
  leadership: 'Lãnh đạo',
  compliance: 'Tuân thủ',
  safety: 'An toàn',
  other: 'Khác',
};

export const QUALIFICATION_TYPES = [
  'bachelor',
  'master',
  'doctorate',
  'certificate',
  'diploma',
  'other',
] as const;

export const QUALIFICATION_TYPE_LABELS: Record<string, string> = {
  bachelor: 'Cử nhân',
  master: 'Thạc sĩ',
  doctorate: 'Tiến sĩ',
  certificate: 'Chứng chỉ',
  diploma: 'Chứng nhận',
  other: 'Khác',
};

export const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'PROBATION',
] as const;

export const EMPLOYMENT_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'TERMINATED',
] as const;

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang làm việc',
  INACTIVE: 'Tạm ngưng',
  ON_LEAVE: 'Nghỉ phép',
  TERMINATED: 'Đã nghỉ việc',
};
