export interface CreateProgramCourseMapInput {
  program_id: number | string;
  course_id: number | string;
  block_id?: number | string | null;
  is_required?: boolean;
  display_order?: number | string | null;
}

export type UpdateProgramCourseMapInput = Partial<CreateProgramCourseMapInput>;

export interface ProgramCourseMapQueryInput {
  page?: number;
  limit?: number;
  programId?: number | string;
  blockId?: number | string | null;
  required?: boolean | string;
  search?: string;
}
