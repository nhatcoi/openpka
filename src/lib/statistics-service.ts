import { Pool } from 'pg';
import {
  EnrollmentStatistic,
  ProgramStatistic,
  EmployeeStatistic,
  AcademicPerformanceStatistic,
  OrganizationalStatistic,
  TrainingEffectivenessStatistic,
  FinancialOverviewStatistic,
  DashboardSummary,
  StatisticsFilters,
  StatisticsResponse
} from '@/types/statistics';

// Database connection singleton
class DatabaseConnection {
  private static instance: Pool;

  public static getInstance(): Pool {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
    }
    return DatabaseConnection.instance;
  }
}

export class StatisticsService {
  private db: Pool;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * Get enrollment statistics for a given time period
   */
  async getEnrollmentStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<StatisticsResponse<EnrollmentStatistic>> {
    try {
      const query = 'SELECT * FROM get_enrollment_statistics($1, $2)';
      const result = await this.db.query(query, [startDate, endDate]);
      
      return {
        data: result.rows.map(row => ({
          period_label: row.period_label,
          total_enrollments: parseInt(row.total_enrollments),
          active_enrollments: parseInt(row.active_enrollments),
          completed_enrollments: parseInt(row.completed_enrollments),
          dropped_enrollments: parseInt(row.dropped_enrollments),
          enrollment_rate: parseFloat(row.enrollment_rate)
        })),
        metadata: {
          total: result.rows.length,
          filters: { startDate, endDate },
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching enrollment statistics:', error);
      throw new Error('Failed to fetch enrollment statistics');
    }
  }

  /**
   * Get program statistics
   */
  async getProgramStatistics(): Promise<StatisticsResponse<ProgramStatistic>> {
    try {
      const query = 'SELECT * FROM get_program_statistics()';
      const result = await this.db.query(query);
      
      return {
        data: result.rows.map(row => ({
          program_id: parseInt(row.program_id),
          program_name: row.program_name || 'Unknown Program',
          major_name: row.major_name || 'Unknown Major',
          org_unit_name: row.org_unit_name || 'Unknown Unit',
          total_credits: parseInt(row.total_credits),
          status: row.status,
          student_count: parseInt(row.student_count),
          avg_gpa: parseFloat(row.avg_gpa) || 0,
          graduation_rate: parseFloat(row.graduation_rate) || 0
        })),
        metadata: {
          total: result.rows.length,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching program statistics:', error);
      throw new Error('Failed to fetch program statistics');
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStatistics(): Promise<StatisticsResponse<EmployeeStatistic>> {
    try {
      const query = 'SELECT * FROM get_employee_statistics()';
      const result = await this.db.query(query);
      
      return {
        data: result.rows.map(row => ({
          employment_type: row.employment_type,
          total_employees: parseInt(row.total_employees),
          active_employees: parseInt(row.active_employees),
          terminated_employees: parseInt(row.terminated_employees),
          avg_performance_score: parseFloat(row.avg_performance_score) || 0,
          training_completion_rate: parseFloat(row.training_completion_rate) || 0
        })),
        metadata: {
          total: result.rows.length,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching employee statistics:', error);
      throw new Error('Failed to fetch employee statistics');
    }
  }

  /**
   * Get academic performance statistics
   */
  async getAcademicPerformanceStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<StatisticsResponse<AcademicPerformanceStatistic>> {
    try {
      const query = 'SELECT * FROM get_academic_performance_stats($1, $2)';
      const result = await this.db.query(query, [startDate, endDate]);
      
      return {
        data: result.rows.map(row => ({
          course_code: row.course_code,
          course_name: row.course_name || 'Unknown Course',
          org_unit_name: row.org_unit_name || 'Unknown Unit',
          total_sections: parseInt(row.total_sections),
          total_enrollments: parseInt(row.total_enrollments),
          avg_class_size: parseFloat(row.avg_class_size) || 0,
          pass_rate: parseFloat(row.pass_rate) || 0,
          avg_grade: parseFloat(row.avg_grade) || 0
        })),
        metadata: {
          total: result.rows.length,
          filters: { startDate, endDate },
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching academic performance statistics:', error);
      throw new Error('Failed to fetch academic performance statistics');
    }
  }

  /**
   * Get organizational statistics
   */
  async getOrganizationalStatistics(): Promise<StatisticsResponse<OrganizationalStatistic>> {
    try {
      const query = 'SELECT * FROM get_organizational_stats()';
      const result = await this.db.query(query);
      
      return {
        data: result.rows.map(row => ({
          org_unit_type: row.org_unit_type || 'Unknown',
          total_units: parseInt(row.total_units),
          active_units: parseInt(row.active_units),
          total_employees: parseInt(row.total_employees),
          total_courses: parseInt(row.total_courses),
          total_programs: parseInt(row.total_programs),
          avg_employees_per_unit: parseFloat(row.avg_employees_per_unit) || 0
        })),
        metadata: {
          total: result.rows.length,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching organizational statistics:', error);
      throw new Error('Failed to fetch organizational statistics');
    }
  }

  /**
   * Get training effectiveness statistics
   */
  async getTrainingEffectivenessStatistics(): Promise<StatisticsResponse<TrainingEffectivenessStatistic>> {
    try {
      const query = 'SELECT * FROM get_training_effectiveness_stats()';
      const result = await this.db.query(query);
      
      return {
        data: result.rows.map(row => ({
          training_title: row.training_title,
          training_provider: row.training_provider || 'Unknown Provider',
          total_participants: parseInt(row.total_participants),
          completion_rate: parseFloat(row.completion_rate) || 0,
          avg_completion_days: parseFloat(row.avg_completion_days) || 0,
          participant_satisfaction: row.participant_satisfaction ? parseFloat(row.participant_satisfaction) : null
        })),
        metadata: {
          total: result.rows.length,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching training effectiveness statistics:', error);
      throw new Error('Failed to fetch training effectiveness statistics');
    }
  }

  /**
   * Get financial overview statistics
   */
  async getFinancialOverviewStatistics(): Promise<StatisticsResponse<FinancialOverviewStatistic>> {
    try {
      const query = 'SELECT * FROM get_financial_overview_stats()';
      const result = await this.db.query(query);
      
      return {
        data: result.rows.map(row => ({
          metric_name: row.metric_name,
          metric_value: parseFloat(row.metric_value) || 0,
          period_label: row.period_label
        })),
        metadata: {
          total: result.rows.length,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Error fetching financial overview statistics:', error);
      throw new Error('Failed to fetch financial overview statistics');
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const query = 'SELECT * FROM get_dashboard_summary()';
      const result = await this.db.query(query);
      
      if (result.rows.length === 0) {
        throw new Error('No dashboard data available');
      }

      const row = result.rows[0];
      return {
        total_students: parseInt(row.total_students) || 0,
        total_employees: parseInt(row.total_employees) || 0,
        total_courses: parseInt(row.total_courses) || 0,
        total_programs: parseInt(row.total_programs) || 0,
        active_enrollments: parseInt(row.active_enrollments) || 0,
        pending_approvals: parseInt(row.pending_approvals) || 0,
        system_health_score: parseFloat(row.system_health_score) || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw new Error('Failed to fetch dashboard summary');
    }
  }

  /**
   * Execute custom query for advanced statistics
   */
  async executeCustomQuery(query: string, params: any[] = []): Promise<any[]> {
    try {
      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error executing custom query:', error);
      throw new Error('Failed to execute custom query');
    }
  }

  /**
   * Get comprehensive statistics for reporting
   */
  async getComprehensiveReport(filters: StatisticsFilters = {}): Promise<{
    summary: DashboardSummary;
    enrollments: StatisticsResponse<EnrollmentStatistic>;
    programs: StatisticsResponse<ProgramStatistic>;
    employees: StatisticsResponse<EmployeeStatistic>;
    academic: StatisticsResponse<AcademicPerformanceStatistic>;
    organizational: StatisticsResponse<OrganizationalStatistic>;
    training: StatisticsResponse<TrainingEffectivenessStatistic>;
    financial: StatisticsResponse<FinancialOverviewStatistic>;
  }> {
    const startDate = filters.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const endDate = filters.endDate || new Date();

    try {
      const [
        summary,
        enrollments,
        programs,
        employees,
        academic,
        organizational,
        training,
        financial
      ] = await Promise.all([
        this.getDashboardSummary(),
        this.getEnrollmentStatistics(startDate, endDate),
        this.getProgramStatistics(),
        this.getEmployeeStatistics(),
        this.getAcademicPerformanceStatistics(startDate, endDate),
        this.getOrganizationalStatistics(),
        this.getTrainingEffectivenessStatistics(),
        this.getFinancialOverviewStatistics()
      ]);

      return {
        summary,
        enrollments,
        programs,
        employees,
        academic,
        organizational,
        training,
        financial
      };
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw new Error('Failed to generate comprehensive report');
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.db.end();
  }
}

// Export singleton instance
export const statisticsService = new StatisticsService();