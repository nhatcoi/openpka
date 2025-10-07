import { ProgramBlockGroupType } from '@/constants/programs';

export interface CreateProgramBlockGroupInput {
  block_id: number | string;
  code: string;
  title: string;
  group_type?: ProgramBlockGroupType | string;
  display_order?: number | string | null;
}

export type UpdateProgramBlockGroupInput = Partial<CreateProgramBlockGroupInput>;

export interface ProgramBlockGroupQueryInput {
  page?: number;
  limit?: number;
  programId?: number | string;
  blockId?: number | string | null;
  groupType?: ProgramBlockGroupType | string;
  search?: string;
}

export interface CreateProgramBlockGroupRuleInput {
  group_id: number | string;
  min_credits?: number | string | null;
  max_credits?: number | string | null;
  min_courses?: number | string | null;
  max_courses?: number | string | null;
}

export type UpdateProgramBlockGroupRuleInput = Partial<CreateProgramBlockGroupRuleInput>;

export interface ProgramBlockGroupRuleQueryInput {
  groupId?: number | string;
}
