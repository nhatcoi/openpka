// Cohort-related enums and helpers

export enum CohortStatus {
  PLANNING = 'PLANNING',
  RECRUITING = 'RECRUITING', 
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  SUSPENDED = 'SUSPENDED',
}

export enum CohortIntakeTerm {
  FALL = 'Fall',
  SPRING = 'Spring', 
  SUMMER = 'Summer',
  YEAR_ROUND = 'Year-round',
}

export const COHORT_STATUSES: CohortStatus[] = [
  CohortStatus.PLANNING,
  CohortStatus.RECRUITING,
  CohortStatus.ACTIVE,
  CohortStatus.GRADUATED,
  CohortStatus.SUSPENDED,
];

export const COHORT_INTAKE_TERMS: CohortIntakeTerm[] = [
  CohortIntakeTerm.FALL,
  CohortIntakeTerm.SPRING,
  CohortIntakeTerm.SUMMER,
  CohortIntakeTerm.YEAR_ROUND,
];

// Helper functions
export function getCohortStatusLabel(status: CohortStatus | string): string {
  switch (status) {
    case CohortStatus.PLANNING:
      return 'Đang lập kế hoạch';
    case CohortStatus.RECRUITING:
      return 'Đang tuyển sinh';
    case CohortStatus.ACTIVE:
      return 'Đang học';
    case CohortStatus.GRADUATED:
      return 'Đã tốt nghiệp';
    case CohortStatus.SUSPENDED:
      return 'Tạm dừng';
    default:
      return status;
  }
}

export function getCohortStatusColor(status: CohortStatus | string): 'default' | 'info' | 'warning' | 'success' | 'error' {
  switch (status) {
    case CohortStatus.ACTIVE:
      return 'success';
    case CohortStatus.RECRUITING:
      return 'info';
    case CohortStatus.PLANNING:
      return 'default';
    case CohortStatus.GRADUATED:
      return 'success';
    case CohortStatus.SUSPENDED:
      return 'warning';
    default:
      return 'default';
  }
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

// Utility functions
export function generateCohortCode(intakeYear: number, intakeTerm: string, orgUnitCode?: string): string {
  const year = intakeYear.toString().slice(-2); // 2024 -> 24
  const term = intakeTerm.charAt(0).toUpperCase(); // Fall -> F
  
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

// Validation
export function isValidCohortStatus(status: string): boolean {
  return COHORT_STATUSES.includes(status as CohortStatus);
}

export function isValidCohortIntakeTerm(term: string): boolean {
  return COHORT_INTAKE_TERMS.includes(term as CohortIntakeTerm);
}

// Default values
export const COHORT_DEFAULTS = {
  STATUS: CohortStatus.PLANNING,
  INTAKE_TERM: CohortIntakeTerm.FALL,
  IS_ACTIVE: true,
} as const;
