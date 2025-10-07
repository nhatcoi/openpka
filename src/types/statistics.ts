// Types for database statistics

export interface EnrollmentStatistic {
  period_label: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  dropped_enrollments: number;
  enrollment_rate: number;
}

export interface ProgramStatistic {
  program_id: number;
  program_name: string;
  major_name: string;
  org_unit_name: string;
  total_credits: number;
  status: string;
  student_count: number;
  avg_gpa: number;
  graduation_rate: number;
}

export interface EmployeeStatistic {
  employment_type: string;
  total_employees: number;
  active_employees: number;
  terminated_employees: number;
  avg_performance_score: number;
  training_completion_rate: number;
}

export interface AcademicPerformanceStatistic {
  course_code: string;
  course_name: string;
  org_unit_name: string;
  total_sections: number;
  total_enrollments: number;
  avg_class_size: number;
  pass_rate: number;
  avg_grade: number;
}

export interface OrganizationalStatistic {
  org_unit_type: string;
  total_units: number;
  active_units: number;
  total_employees: number;
  total_courses: number;
  total_programs: number;
  avg_employees_per_unit: number;
}

export interface TrainingEffectivenessStatistic {
  training_title: string;
  training_provider: string;
  total_participants: number;
  completion_rate: number;
  avg_completion_days: number;
  participant_satisfaction: number | null;
}

export interface FinancialOverviewStatistic {
  metric_name: string;
  metric_value: number;
  period_label: string;
}

export interface DashboardSummary {
  total_students: number;
  total_employees: number;
  total_courses: number;
  total_programs: number;
  active_enrollments: number;
  pending_approvals: number;
  system_health_score: number;
}

export interface StatisticsFilters {
  startDate?: Date;
  endDate?: Date;
  orgUnitId?: number;
  programId?: number;
  employmentType?: string;
  status?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface StatisticsResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page?: number;
    limit?: number;
    filters?: StatisticsFilters;
    generatedAt: Date;
  };
}