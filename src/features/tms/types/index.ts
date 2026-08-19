export interface ProgramSummary {
  id: string;
  code: string;
  name: string;
  version: string;
  status: string;
  org_unit_id?: string | null;
  total_credits?: number | null;
  duration_years?: number | null;
  degree_level?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  OrgUnit?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CourseSummary {
  id: string;
  code: string;
  name: string;
  credits: number;
  course_type?: string | null;
  status: string;
  description?: string | null;
  org_unit_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MajorSummary {
  id: string;
  code: string;
  name: string;
  status: string;
  degree_level?: string | null;
  org_unit_id?: string | null;
}

export interface OrgUnitSimple {
  id: number | string;
  name: string;
  code: string;
  type?: string;
  parent_id?: number | string | null;
}

export interface OrgUnitApiItem {
  id?: string | number | null;
  value?: string | number | null;
  code: string;
  name: string;
  label?: string | null;
}

export interface OrgUnitOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

export interface Major {
  id: number | string;
  code: string;
  name_vi: string;
  name_en?: string;
  short_name?: string;
  slug?: string;
  degree_level: string;
  org_unit_id: number | string;
  duration_years?: number | string;
  total_credits_min?: number | string;
  total_credits_max?: number | string;
  semesters_per_year?: number | string;
  default_quota?: number | string | null;
  status: string;
  closed_at?: string | null;
  metadata?: Record<string, any> | null;
  created_by?: number | string | null;
  updated_by?: number | string | null;
  created_at?: string;
  updated_at?: string;
}

export type MajorData = Major;

export interface MajorFormData {
  code: string;
  name_vi: string;
  name_en: string;
  short_name: string;
  slug: string;
  degree_level: any;
  org_unit_id: number;
  duration_years: number;
  total_credits_min: number;
  total_credits_max: number;
  semesters_per_year: number;
  default_quota: number;
  status: string;
  closed_at: string;
  metadata: Record<string, any>;
}

export interface MajorApiResponseItem {
  id: string | number;
  code?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  short_name?: string | null;
  slug?: string | null;
  degree_level?: string | null;
  org_unit_id?: string | number | null;
  duration_years?: number | string | null;
  total_credits_min?: number | string | null;
  total_credits_max?: number | string | null;
  semesters_per_year?: number | string | null;
  status?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MajorListApiData {
  items: MajorApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MajorListApiResponse {
  success: boolean;
  data?: MajorListApiData;
  error?: string;
}

export interface MajorListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  shortName?: string;
  slug?: string;
  degreeLevel: string;
  orgUnitId: string;
  durationYears?: number;
  totalCreditsMin?: number;
  totalCreditsMax?: number;
  semestersPerYear?: number;
  status: string;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface Program {
  id: string;
  code: string;
  name_vi: string;
  name_en?: string;
  version?: string;
  status?: string;
  org_unit_id?: string;
  total_credits?: number | null;
  duration_years?: number | null;
  degree_level?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  OrgUnit?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface ProgramDetailFetchResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export type ProgramDetailApiWrapper = ProgramDetailFetchResponse;

export interface ProgramOption {
  id: string;
  code: string;
  name?: string;
  label?: string;
  name_vi?: string;
  nameVi?: string;
  totalCredits?: number;
  degree_level?: string;
}

export interface CourseOption {
  id: string;
  code: string;
  name: string;
  credits: number;
  label?: string;
}

export interface CourseFormData {
  code: string;
  nameVi: string;
  nameEn: string;
  credits: number;
  theory_credit?: number;
  practical_credit?: number;
  orgUnitId: string;
  type: any;
  description: string;
  prerequisites: (string | { id: string; code: string; name_vi: string; name_en: string; credits: number; status: string; label: string; value: string })[];
}

export interface Cohort {
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
  students?: Array<{
    id: string;
    student_id: string;
    status: string;
    gpa: number;
  }>;
  student_count?: number;
  Major?: {
    id: string;
    code: string;
    name_vi: string;
  };
  Program?: {
    id: string;
    code: string;
    name_vi: string;
  };
  OrgUnit?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface CohortStats {
  total_cohorts?: number;
  active_cohorts?: number;
  graduated_cohorts?: number;
  total_students: number;
  active_students?: number;
  graduated_students?: number;
  average_gpa?: number;
  average_students_per_cohort?: number;
  completion_rate: number;
}

export interface CohortSummary {
  id: string;
  code: string;
  name_vi: string;
  academic_year: string;
  intake_year: number;
  status: string;
  planned_quota: number;
  actual_quota: number;
  student_count: number;
  completion_rate: number;
}

export interface CohortFormData {
  code: string;
  name_vi: string;
  name_en: string;
  academic_year: string;
  intake_year: number;
  intake_term: string;
  major_id: string;
  program_id: string;
  org_unit_id: string;
  planned_quota?: number | string;
  actual_quota?: number | string;
  start_date: string;
  expected_graduation_date: string;
  status: string;
  is_active: boolean;
  description: string;
}

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

export interface Course {
  id: string | number;
  code: string;
  name_vi?: string;
  name_en?: string;
  name?: string;
  credits?: number;
  theory_credits?: number;
  practical_credits?: number;
  course_type?: string | null;
  type?: string | null;
  status?: string;
  description?: string | null;
  org_unit_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  OrgUnit?: {
    id?: string | number;
    name: string;
    code?: string;
  } | null;
}

export interface CourseDetail extends Course {
  theory_credit?: number;
  practical_credit?: number;
  prerequisites?: any;
  corequisites?: any;
  previous_courses?: any;
  syllabus?: any;
  versions?: any[];
  CourseVersion?: CourseVersion[];
  workflows?: Array<{
    id: string;
    status: string;
    workflow_stage: any;
    priority: any;
    notes?: string;
    created_at: string;
    updated_at: string;
  }>;
  contents?: Array<{
    id: string;
    prerequisites?: string;
    learning_objectives?: Array<{
      type: string;
      objective: string;
    }>;
    assessment_methods?: Array<{
      method: string;
      weight: number;
      description: string;
    }>;
    passing_grade: number;
    created_at: string;
    updated_at: string;
  }>;
  course_approval_history?: Array<{
    id: string;
    action?: string;
    status?: string;
    comment?: string;
    created_at?: string;
    user?: { name?: string };
    [key: string]: any;
  }>;
  coordinators?: Array<{
    id: string;
    is_primary?: boolean;
    role?: string;
    employee?: { id: string; name?: string; email?: string; [key: string]: any };
    [key: string]: any;
  }>;
  lecturers?: Array<{
    id: string;
    employee?: { id: string; name?: string; email?: string; [key: string]: any };
    [key: string]: any;
  }>;
  unified_workflow?: {
    id: string;
    status: string;
    current_step: number;
    initiated_at: string;
    completed_at?: string;
    workflow: {
      workflow_name: string;
      steps: Array<{
        step_order: number;
        step_name: string;
        approver_role: string;
        timeout_days: number;
      }>;
    };
    approval_records: Array<{
      id: string;
      action: string;
      comments?: string;
      approved_at?: string;
      approver: {
        id: string;
        full_name: string;
        email: string;
      };
    }>;
  };
  instructor_qualifications?: any[];
  course_syllabus?: any[];
  OrgUnit?: {
    id?: string | number;
    name: string;
    code?: string;
  } | null;
}

export interface CourseVersion {
  id: string;
  course_id?: string;
  version: string;
  status: string;
  effective_from?: string;
  effective_to?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CourseSyllabus {
  id: string;
  course_id?: string;
  course_version_id?: string;
  version?: string;
  version_no?: number;
  status: any;
  language?: 'vi' | 'en' | 'vi-en' | string;
  academic_year?: string;
  effective_from?: string;
  effective_to?: string;
  is_current?: boolean;
  basic_info?: any;
  learning_outcomes?: any;
  weekly_plan?: any;
  assessment_plan?: any;
  teaching_methods?: any;
  materials?: any;
  policies?: any;
  rubrics?: any;
  data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CourseApiResponseItem {
  id: string | number;
  code?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  credits?: number | string | null;
  theory_credit?: number | string | null;
  practical_credit?: number | string | null;
  type?: string | null;
  status?: string | null;
  org_unit_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  OrgUnit?: {
    id?: string | number | null;
    name: string;
    code?: string | null;
  } | null;
}

export interface CourseListApiData {
  items: CourseApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CourseListApiResponse {
  success: boolean;
  data?: CourseListApiData;
  error?: string;
}

export interface CourseListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  credits: number;
  theoryCredit: number;
  practicalCredit: number;
  type: string;
  status: string;
  orgUnitId?: string;
  createdAt?: string;
  updatedAt?: string;
  orgUnit?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface DashboardStats {
  overview: {
    programs: {
      total: number;
      draft: number;
      published: number;
      approved: number;
      reviewing: number;
    };
    courses: {
      total: number;
      draft: number;
      published: number;
      approved: number;
      reviewing: number;
    };
    majors: number;
    cohorts: number;
  };
  totalPrograms?: number;
  totalCourses?: number;
  totalMajors?: number;
  totalCohorts?: number;
  activePrograms?: number;
  activeCourses?: number;
  activeMajors?: number;
  activeCohorts?: number;
}

export interface HistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  change_summary?: string;
  change_details?: {
    fields?: string[];
    changes?: Record<string, { old_value: any; new_value: any }>;
    initial_values?: any;
    deleted_values?: any;
    metadata?: any;
  };
  actor_id?: string;
  actor_name?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  code: string;
  name: string;
  status: any;
  owner?: string;
  updatedAt?: string;
  type?: 'major' | 'program' | 'course' | 'cohort';
  submitted_by?: string;
  submitted_at?: string;
  updated_at?: string;
}

export interface ResourceConfig {
  label: string;
  fetchUrl: string;
  statuses: any[];
  getStatusLabel: (status: any) => string;
  getStatusColor: (status: any) => any;
  mapItems: (items: any[]) => ReviewRow[];
  detailPath: (id: string) => string;
  apiPath?: string;
  typeName?: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: any;
  note?: string;
}

export interface ProgramBlock {
  id: string;
  code: string;
  title: string;
  block_type: string;
  display_order: number;
  _count?: {
    ProgramCourseMap: number;
  };
}

export interface ProgramBlockGroup {
  id: string;
  code: string;
  title: string;
  group_type: string;
  display_order: number | null;
  description: string | null;
  parent_id: string | null;
  parent?: {
    id: string;
    code: string;
    title: string;
  };
  children: Array<{
    id: string;
    code: string;
    title: string;
    group_type: string;
    display_order: number | null;
  }>;
  _count?: {
    ProgramCourseMap: number;
    children: number;
  };
}

export interface BlockFormState {
  id: string | null;
  type: 'block' | 'group';
  code: string;
  title: string;
  block_type?: string;
  group_type?: string;
  display_order: number;
  description?: string;
  parent_id?: string;
}

export interface ProgramBlockOption {
  id: string;
  code: string;
  title: string;
  blockType?: any;
}

export interface ProgramCourseMapListItem {
  id: string;
  programId: string;
  courseId: string;
  blockId: string | null;
  groupId: string | null;
  isRequired: boolean;
  displayOrder: number;
  course: {
    id: string;
    code: string;
    nameVi?: string | null;
    nameEn?: string | null;
    credits?: number | null;
    type?: string | null;
  } | null;
  block: {
    id: string;
    code: string;
    title: string;
  } | null;
}

export interface ProgramListApiItem {
  id?: string | number;
  code?: string;
  name_vi?: string;
  name_en?: string;
  label?: string;
}

export interface ProgramListApiResponse {
  success: boolean;
  data?: {
    items?: ProgramListApiItem[];
  };
  error?: string;
}

export interface ProgramBlockListItem {
  id?: string | number;
  code?: string;
  title?: string;
  blockType?: any;
}

export interface ProgramBlockListResponse {
  success: boolean;
  data?: {
    items?: ProgramBlockListItem[];
  };
  error?: string;
}

export interface ProgramCourseMapApiItem {
  id?: string | number;
  programId?: string | number;
  courseId?: string | number;
  blockId?: string | number | null;
  groupId?: string | number | null;
  isRequired?: boolean;
  displayOrder?: number;
  course?: {
    id?: string | number;
    code?: string;
    nameVi?: string;
    nameEn?: string;
    credits?: number;
    type?: string;
  } | null;
  block?: {
    id?: string | number;
    code?: string;
    title?: string;
  } | null;
}

export interface ProgramCourseMapApiResponse {
  success: boolean;
  data?: {
    items?: ProgramCourseMapApiItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface CourseListApiItem {
  id?: string | number;
  code?: string;
  name_vi?: string;
  name_en?: string;
  credits?: number;
  type?: string;
}

export interface CourseListRawApiResponse {
  success: boolean;
  data?: {
    items?: CourseListApiItem[];
  };
  error?: string;
}


