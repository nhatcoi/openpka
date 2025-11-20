import { CurriculumStatus } from '@/constants/curriculum';
import { ProgramApiResponseItem } from '@/app/(tms)/tms/programs/program-utils';

export interface CurriculumCourseItem {
  id: string;
  courseId: string;
  code: string;
  name: string;
  credits: number;
  required: boolean;
  blockCode?: string | null;
  blockTitle?: string | null;
  groupCode?: string | null;
  groupTitle?: string | null;
  note?: string | null;
}

export interface CurriculumSemesterItem {
  id: string;
  name: string;
  order: number;
  totalCredits: number;
  requiredCredits: number;
  optionalCredits: number;
  courseCount: number;
  note?: string | null;
  courses: CurriculumCourseItem[];
}

export interface CurriculumStructureSummary {
  semesters: number;
  courseCount: number;
  totalCredits: number;
  requiredCredits: number;
  optionalCredits: number;
}

export interface CurriculumStructure {
  semesters: CurriculumSemesterItem[];
  summary: CurriculumStructureSummary;
  raw?: unknown;
}

export interface CurriculumVersionItem {
  id: string;
  version: string;
  title: string;
  description?: string | null;
  status: CurriculumStatus;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  totalCredits: number;
  approvalNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  structure: CurriculumStructure;
}

export interface CurriculumProgramSummary {
  id: string;
  code: string | null;
  nameVi: string | null;
  nameEn?: string | null;
  status: string | null;
  totalCredits: number | null;
  version?: string | null;
  orgUnit?: {
    id: string;
    code: string;
    name: string;
  } | null;
  stats: {
    blockCount: number;
    courseCount: number;
    studentCount: number;
    curriculumVersionCount: number;
  };
  latestVersion?: {
    id: string;
    version: string;
    title: string;
    status: CurriculumStatus;
    effectiveFrom?: string | null;
    effectiveTo?: string | null;
    totalCredits: number;
  } | null;
}

export interface CurriculumDetailResponse {
  program: ProgramApiResponseItem;
  versions: CurriculumVersionItem[];
  stats: {
    versionCount: number;
    activeVersionId: string | null;
  };
}
