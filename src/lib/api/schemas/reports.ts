export interface ReportSummary {
  totalPrograms: number;
  activePrograms: number;
  draftPrograms: number;
  pendingPrograms: number;
  publishedPrograms: number;
  totalCourses: number;
  totalMajors: number;
  totalCredits: number;
  averageCoursesPerProgram: number;
}

export interface StatusBreakdownItem {
  status: string;
  label: string;
  count: number;
}

export interface OrgUnitProgramItem {
  orgUnitId: string | null;
  orgUnitCode: string | null;
  orgUnitName: string;
  programCount: number;
}

export interface CourseTypeBreakdownItem {
  type: string;
  label: string;
  count: number;
}

export interface BlockDistributionItem {
  blockType: string;
  label: string;
  count: number;
}

export interface TopProgramItem {
  programId: string;
  code: string | null;
  name: string;
  totalCourses: number;
  totalCredits: number;
  status: string | null;
}

export interface RecentProgramItem {
  programId: string;
  code: string | null;
  name: string;
  status: string | null;
  updatedAt: string | null;
  orgUnitName: string | null;
}

export interface RecentCourseItem {
  courseId: string;
  code: string;
  name: string;
  status: string | null;
  updatedAt: string | null;
  orgUnitName: string | null;
}

export interface ReportsOverviewResponse {
  summary: ReportSummary;
  programStatus: StatusBreakdownItem[];
  programsByOrgUnit: OrgUnitProgramItem[];
  courseTypeBreakdown: CourseTypeBreakdownItem[];
  courseStatusBreakdown: StatusBreakdownItem[];
  blockDistribution: BlockDistributionItem[];
  topProgramsByCourses: TopProgramItem[];
  topProgramsByCredits: TopProgramItem[];
  recentPrograms: RecentProgramItem[];
  recentCourses: RecentCourseItem[];
}
