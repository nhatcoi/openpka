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

export const TRAINING_STATUS = [
  'enrolled',
  'in_progress',
  'completed',
  'cancelled',
  'failed',
] as const;

export const TRAINING_STATUS_LABELS: Record<string, string> = {
  enrolled: 'Đã đăng ký',
  in_progress: 'Đang tham gia',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  failed: 'Không đạt',
};

export const TRAINING_STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  enrolled: 'default',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
  failed: 'error',
};

export const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Nghỉ phép năm' },
  { value: 'SICK', label: 'Nghỉ ốm' },
  { value: 'PERSONAL', label: 'Nghỉ cá nhân' },
  { value: 'MATERNITY', label: 'Nghỉ thai sản' },
  { value: 'STUDY', label: 'Nghỉ học tập' },
  { value: 'EMERGENCY', label: 'Nghỉ khẩn cấp' },
] as const;

export const LEAVE_STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
};

export const LOG_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'ASSIGN',
  'REMOVE',
  'VIEW',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
] as const;

export const LOG_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  ASSIGN: 'Gán',
  REMOVE: 'Gỡ bỏ',
  VIEW: 'Xem',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  EXPORT: 'Xuất dữ liệu',
  IMPORT: 'Nhập dữ liệu',
};

export const LOG_ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  ASSIGN: 'warning',
  REMOVE: 'default',
  VIEW: 'default',
  LOGIN: 'primary',
  LOGOUT: 'secondary',
  EXPORT: 'warning',
  IMPORT: 'info',
};

export const LOG_ENTITY_TYPES = [
  'employee',
  'user',
  'org_assignment',
  'academic_title',
  'qualification',
  'training',
  'assignment',
  'employee_qualification',
  'employee_training',
  'employee_academic_title',
  'performance_review',
  'leave_request',
] as const;

export const LOG_ENTITY_TYPE_LABELS: Record<string, string> = {
  employee: 'Nhân viên',
  user: 'Người dùng',
  org_assignment: 'Phân công tổ chức',
  assignment: 'Phân công',
  academic_title: 'Học hàm / Học vị',
  qualification: 'Bằng cấp',
  training: 'Đào tạo',
  employee_qualification: 'Bằng cấp nhân viên',
  employee_training: 'Đào tạo nhân viên',
  employee_academic_title: 'Học hàm nhân viên',
  performance_review: 'Đánh giá hiệu suất',
  leave_request: 'Đơn xin nghỉ',
};

