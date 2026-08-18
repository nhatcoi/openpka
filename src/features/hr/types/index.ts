export interface EmployeeSummary {
  id: string;
  user_id?: string | null;
  employee_no?: string | null;
  employment_type: string;
  status: string;
  hired_at?: string | null;
  terminated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  User?: {
    id: string;
    username?: string;
    full_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
  user?: {
    id: string;
    username?: string;
    full_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
  } | null;
  position?: {
    id: string;
    title: string;
    code?: string;
  } | null;
  assignments?: any[];
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
  Employment?: Array<{
    id: string;
    contract_no: string;
    contract_type: string;
    start_date: string;
    end_date?: string | null;
    fte: number;
    salary_band: string;
  }>;
  employments?: Array<{
    id: string;
    contract_no: string;
    contract_type: string;
    start_date: string;
    end_date?: string | null;
    fte: number;
    salary_band: string;
  }>;
}

export type Employee = EmployeeSummary;

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

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  gender?: string | null;
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

export interface Training {
  id: string;
  title: string;
  provider: string;
  start_date: string;
  end_date: string;
  training_type: string;
  description?: string;
}

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  training_id: string;
  completion_date?: string | null;
  status: string;
  result?: string | null;
  score?: number | null;
  certificate_url?: string | null;
  Employee?: any;
  Training?: Training;
  employees?: any;
  trainings?: Training;
}

export interface Qualification {
  id: string;
  code: string;
  title: string;
}

export interface EmployeeQualification {
  id: string;
  employee_id: string;
  qualification_id: string;
  field_of_study?: string | null;
  major_field?: string | null;
  issued_by?: string | null;
  institution?: string | null;
  issued_date?: string | null;
  awarded_date?: string | null;
  Employee?: any;
  Qualification?: Qualification;
  employees?: any;
  qualifications?: Qualification;
}

export interface AcademicTitle {
  id: string;
  code: string;
  title: string;
}

export interface EmployeeAcademicTitle {
  id: string;
  employee_id: string;
  academic_title_id: string;
  decision_no?: string | null;
  decision_date?: string | null;
  field_of_study?: string | null;
  issued_date?: string | null;
  awarded_date?: string | null;
  Employee?: any;
  AcademicTitle?: AcademicTitle;
  employees?: any;
  academic_titles?: AcademicTitle;
}

export interface Employment {
  id: string;
  employee_id: string;
  contract_no: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  fte: number;
  salary_band: string;
  employees?: any;
  Employee?: any;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  RolePermission?: any[];
  role_permission?: any[];
  UserRole?: any[];
  user_role?: any[];
  _count?: {
    RolePermission?: number;
    UserRole?: number;
  };
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  resource?: string | null;
  action?: string | null;
  description?: string | null;
  RolePermission?: any[];
  role_permission?: any[];
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  Role?: Role;
  roles?: Role;
  Permission?: Permission;
  permissions?: Permission;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  User?: any;
  users?: any;
  users_user_role_user_idTousers?: any;
  users_user_role_assigned_byTousers?: any;
  Role?: Role;
  roles?: Role;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: string;
  approved_by?: string | null;
  Employee?: any;
  employees?: any;
  created_at?: string;
  updated_at?: string;
  comments?: string | null;
}

export interface Assignment {
  id: string;
  employee_id: string;
  org_unit_id: string;
  position_id?: string | null;
  is_primary?: boolean;
  assignment_type: string;
  allocation: string | number;
  start_date: string;
  end_date?: string | null;
  Employee?: any;
  employee?: any;
  OrgUnit?: any;
  org_unit?: any;
  Position?: any;
  position?: any;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period?: string | null;
  score?: string | number | null;
  comments?: string | null;
  created_at?: string;
  updated_at?: string;
  Employee?: any;
  employee?: any;
}

export interface EmployeeLog {
  id: string;
  employee_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  actor_id?: string;
  actor_role?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  employees?: any;
  Employee?: any;
  users?: any;
  User?: any;
}

export interface EvaluationUrl {
  id: string;
  employeeId: string;
  lecturerName: string;
  lecturerEmail: string;
  period: string;
  evaluationUrl: string;
  token: string;
  createdAt: string;
}

export interface EvaluationData {
  id: string;
  employee_id: string;
  review_period: string;
  score: number | null;
  comments: string | null;
  created_at: string;
  updated_at?: string;
  Employee?: any;
  employee?: any;
}

export interface ReportData {
  orgUnit: any;
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  fullTimeEmployees: number;
  partTimeEmployees: number;
  contractEmployees: number;
  internEmployees: number;
  employees: any[];
}

export interface UserData {
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
    description?: string;
    assigned_at?: string;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    description?: string;
    resource: string;
    action: string;
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



