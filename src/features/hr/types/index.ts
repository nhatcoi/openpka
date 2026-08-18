export interface EmployeeSummary {
  id: string;
  user_id: string;
  employee_no?: string | null;
  employment_type: string;
  status: string;
  hired_at?: string | null;
  terminated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  User?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
  OrgAssignment?: Array<{
    id: string;
    employee_id: string;
    org_unit_id: string;
    job_position_id?: string | null;
    is_primary?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    OrgUnit?: {
      id: string;
      name: string;
      code: string;
    } | null;
    JobPosition?: {
      id: string;
      title: string;
      code: string;
    } | null;
  }>;
}

export interface EmployeeFilterParams {
  search?: string;
  status?: string;
  employment_type?: string;
  org_unit_id?: string;
  page?: number;
  limit?: number;
}

export interface EvaluationDetails {
  id: string;
  employee_id: string;
  review_period: string;
  score: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  Employee?: {
    id: string;
    User?: {
      id: string;
      full_name: string;
      email: string;
    } | null;
  } | null;
}

export interface EvaluationPeriodItem {
  review_period: string;
  created_at: string;
  updated_at: string;
  _count: {
    id: number;
  };
}

export interface UserProfileData {
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    phone?: string;
    address?: string;
    dob?: string;
    gender?: string;
    status?: string;
    last_login_at?: string;
    created_at?: string;
    updated_at?: string;
  };
  roles: Array<{
    id: string;
    name: string;
    code?: string;
    description?: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    code: string;
    resource?: string;
    action?: string;
    description?: string;
  }>;
  employee: Array<{
    id: string;
    employee_no?: string;
    employment_type?: string;
    status?: string;
    hired_at?: string;
    terminated_at?: string;
    org_assignments?: Array<{
      id: string;
      org_unit?: {
        id: string;
        name: string;
        code?: string;
      } | null;
    }>;
  }>;
}
