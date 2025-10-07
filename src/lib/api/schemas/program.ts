import { ProgramPriority, ProgramStatus } from '@/constants/programs';

export interface ProgramCourseMapInput {
  course_id: number | string;
  is_required?: boolean;
  display_order?: number;
  // Optional code of the group within the same block that this course belongs to
  group_code?: string | null;
}

export interface ProgramBlockGroupRuleInput {
  min_credits?: number | null;
  max_credits?: number | null;
  min_courses?: number | null;
  max_courses?: number | null;
}

export interface ProgramBlockGroupInput {
  code: string;
  title: string;
  group_type: string; // accepts values like REQUIRED, ELECTIVE, CORE, OTHER (case-insensitive)
  display_order?: number;
  rules?: ProgramBlockGroupRuleInput[];
}

export interface ProgramBlockInput {
  code: string;
  title: string;
  block_type: string;
  display_order?: number;
  courses?: ProgramCourseMapInput[];
  groups?: ProgramBlockGroupInput[];
}

export type ProgramWorkflowAction = 'submit' | 'review' | 'approve' | 'reject' | 'publish';

export interface CreateProgramInput {
  code: string;
  name_vi: string;
  name_en?: string | null;
  description?: string | null;
  version?: string;
  total_credits?: number;
  org_unit_id?: number | string;
  major_id?: number | string;
  status?: ProgramStatus;
  effective_from?: string | null;
  effective_to?: string | null;
  plo?: Record<string, unknown> | null;
  priority?: ProgramPriority;
  blocks?: ProgramBlockInput[];
  standalone_courses?: ProgramCourseMapInput[];
}

export interface UpdateProgramInput extends Partial<CreateProgramInput> {
  workflow_action?: ProgramWorkflowAction;
  workflow_notes?: string | null;
}

export interface ProgramQueryInput {
  page?: number;
  limit?: number;
  status?: ProgramStatus | string;
  orgUnitId?: number;
  search?: string;
  priority?: ProgramPriority | string;
}
