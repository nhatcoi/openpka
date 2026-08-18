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
