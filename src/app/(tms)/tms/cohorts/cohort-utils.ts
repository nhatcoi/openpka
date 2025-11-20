import { WorkflowStatus } from '@/constants/workflow-statuses';

export interface CohortApiResponseItem {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  academic_year: string;
  intake_year: number;
  intake_term: string;
  major_id?: string;
  program_id?: string;
  org_unit_id?: string;
  planned_quota?: number;
  actual_quota?: number;
  start_date?: string;
  expected_graduation_date?: string;
  status: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

export interface CohortListApiData {
  cohorts: CohortApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CohortListApiResponse {
  cohorts?: CohortApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface CohortListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  academicYear: string;
  intakeYear: number;
  intakeTerm: string;
  majorId?: string;
  programId?: string;
  orgUnitId?: string;
  plannedQuota?: number;
  actualQuota?: number;
  startDate?: string;
  expectedGraduationDate?: string;
  status: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

export const mapCohortResponse = (cohort: CohortApiResponseItem): CohortListItem => ({
  id: cohort.id,
  code: cohort.code,
  nameVi: cohort.name_vi,
  nameEn: cohort.name_en,
  academicYear: cohort.academic_year,
  intakeYear: cohort.intake_year,
  intakeTerm: cohort.intake_term,
  majorId: cohort.major_id,
  programId: cohort.program_id,
  orgUnitId: cohort.org_unit_id,
  plannedQuota: cohort.planned_quota,
  actualQuota: cohort.actual_quota,
  startDate: cohort.start_date,
  expectedGraduationDate: cohort.expected_graduation_date,
  status: (cohort.status ?? WorkflowStatus.DRAFT) as string,
  isActive: cohort.is_active,
  description: cohort.description,
  createdAt: cohort.created_at,
  updatedAt: cohort.updated_at,
  studentCount: cohort.student_count,
});

