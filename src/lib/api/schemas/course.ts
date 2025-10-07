// Course types without Zod
export interface CreateCourseInput {
  // Step 1: Basic Info
  code: string;
  name_vi: string;
  name_en?: string;
  credits: number;
  theory_credit?: number;
  practical_credit?: number;
  org_unit_id: number;
  type: 'theory' | 'practice' | 'theory_practice' | 'mixed' | 'thesis' | 'internship';
  description?: string;
  
  // Step 2: Prerequisites
  prerequisites?: string[];
  
  // Step 3: Learning Objectives
  learning_objectives?: Array<{
    id: string;
    objective: string;
    type: 'knowledge' | 'skill' | 'attitude';
  }>;
  
  // Step 4: Syllabus (handled by course_syllabus table)
  syllabus?: Array<{
    week: number;
    topic: string;
    objectives: string;
    materials: string;
    assignments: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  }>;
  
  // Step 5: Assessment
  assessment_methods?: Array<{
    id: string;
    method: string;
    weight: number;
    description: string;
  }>;
  passing_grade?: number;
  
  // Step 6: Workflow
  workflow_priority?: 'low' | 'medium' | 'high';
  workflow_notes?: string;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {}

export interface CourseQueryInput {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  search?: string;
  orgUnitId?: number;
  workflowStage?: 'FACULTY' | 'ACADEMIC_OFFICE' | 'ACADEMIC_BOARD';
}

