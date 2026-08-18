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
