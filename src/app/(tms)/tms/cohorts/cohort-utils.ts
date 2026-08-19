import { WorkflowStatus } from '@/constants/workflow-statuses';
import {
  CohortApiResponseItem,
  CohortListApiData,
  CohortListApiResponse,
  CohortListItem,
  PaginationState,
} from '@/features/tms';

export type {
  CohortApiResponseItem,
  CohortListApiData,
  CohortListApiResponse,
  CohortListItem,
  PaginationState,
};

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

