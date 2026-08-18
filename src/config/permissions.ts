/**
 * Centralized Permission Definitions for the entire application.
 */

export const PERMISSIONS = {
  // HR Permissions
  HR: {
    VIEW: 'hr.view',
    EMPLOYEE_VIEW: 'hr.employee.view',
    EMPLOYEE_CREATE: 'hr.employee.create',
    EMPLOYEE_UPDATE: 'hr.employee.update',
    EMPLOYEE_DELETE: 'hr.employee.delete',
    ASSIGNMENT_VIEW: 'hr.assignment.view',
    ASSIGNMENT_CREATE: 'hr.assignment.create',
    ASSIGNMENT_UPDATE: 'hr.assignment.update',
    ASSIGNMENT_DELETE: 'hr.assignment.delete',
    LEAVE_REQUEST_VIEW: 'hr.leave_request.view',
    LEAVE_REQUEST_CREATE: 'hr.leave_request.create',
    LEAVE_REQUEST_UPDATE: 'hr.leave_request.update',
    LEAVE_REQUEST_DELETE: 'hr.leave_request.delete',
    PERFORMANCE_REVIEW_VIEW: 'hr.performance_review.view',
    PERFORMANCE_REVIEW_CREATE: 'hr.performance_review.create',
    PERFORMANCE_REVIEW_UPDATE: 'hr.performance_review.update',
    PERFORMANCE_REVIEW_DELETE: 'hr.performance_review.delete',
    QUALIFICATION_VIEW: 'hr.qualification.view',
    QUALIFICATION_CREATE: 'hr.qualification.create',
    QUALIFICATION_UPDATE: 'hr.qualification.update',
    QUALIFICATION_DELETE: 'hr.qualification.delete',
    TRAINING_VIEW: 'hr.training.view',
    TRAINING_CREATE: 'hr.training.create',
    TRAINING_UPDATE: 'hr.training.update',
    TRAINING_DELETE: 'hr.training.delete',
    ACADEMIC_TITLE_VIEW: 'hr.academic_title.view',
    ACADEMIC_TITLE_CREATE: 'hr.academic_title.create',
    ACADEMIC_TITLE_UPDATE: 'hr.academic_title.update',
    ACADEMIC_TITLE_DELETE: 'hr.academic_title.delete',
    EMPLOYMENT_VIEW: 'hr.employment.view',
    EMPLOYMENT_CREATE: 'hr.employment.create',
    EMPLOYMENT_UPDATE: 'hr.employment.update',
    EMPLOYMENT_DELETE: 'hr.employment.delete',
    RBAC_VIEW: 'hr.rbac.view',
    RBAC_CREATE: 'hr.rbac.create',
    RBAC_UPDATE: 'hr.rbac.update',
    RBAC_DELETE: 'hr.rbac.delete',
    REPORT_VIEW: 'hr.report.view',
  },

  // Org Unit Permissions
  ORG: {
    UNIT_VIEW: 'org_unit.unit.view',
    UNIT_CREATE: 'org_unit.unit.create',
    UNIT_UPDATE: 'org_unit.unit.update',
    UNIT_DELETE: 'org_unit.unit.delete',
    ASSIGNMENT_VIEW: 'org_unit.assignment.view',
    ASSIGNMENT_CREATE: 'org_unit.assignment.create',
    ASSIGNMENT_UPDATE: 'org_unit.assignment.update',
    ASSIGNMENT_DELETE: 'org_unit.assignment.delete',
    TYPE_ADMIN: 'org_unit.type.admin',
    REPORT_VIEW: 'org_unit.report.view',
  },

  // TMS Permissions
  TMS: {
    COURSE_VIEW: 'tms.course.view',
    COURSE_CREATE: 'tms.course.create',
    COURSE_UPDATE: 'tms.course.update',
    COURSE_DELETE: 'tms.course.delete',
    COURSE_APPROVE: 'tms.course.approve',
    PROGRAM_VIEW: 'tms.program.view',
    PROGRAM_CREATE: 'tms.program.create',
    PROGRAM_UPDATE: 'tms.program.update',
    PROGRAM_DELETE: 'tms.program.delete',
    PROGRAM_APPROVE: 'tms.program.approve',
    MAJOR_VIEW: 'tms.major.view',
    MAJOR_CREATE: 'tms.major.create',
    MAJOR_UPDATE: 'tms.major.update',
    MAJOR_DELETE: 'tms.major.delete',
    MAJOR_APPROVE: 'tms.major.approve',
    REPORT_VIEW: 'tms.report.view',
  },

  // Academic Permissions
  ACADEMIC: {
    VIEW: 'academic.view',
    HISTORY_VIEW: 'academic.history.view',
    CURRICULUM_VIEW: 'academic.curriculum.view',
  },

  // Finance Permissions
  FINANCE: {
    VIEW_TUITION: 'finance.viewTuition',
  },
} as const;

/**
 * Check if the user permissions list satisfies the required permission.
 */
export function hasPermission(userPermissions: string[] | undefined, requiredPermission?: string): boolean {
  if (!requiredPermission) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  return userPermissions.includes(requiredPermission);
}
