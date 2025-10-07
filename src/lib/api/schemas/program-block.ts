import { ProgramBlockType } from '@/constants/programs';

export interface CreateProgramBlockInput {
  program_id: number | string;
  code: string;
  title: string;
  block_type?: ProgramBlockType | string;
  display_order?: number | string | null;
}

export type UpdateProgramBlockInput = Partial<CreateProgramBlockInput>;

export interface ProgramBlockQueryInput {
  page?: number;
  limit?: number;
  programId?: number | string;
  search?: string;
  blockType?: ProgramBlockType | string;
}
