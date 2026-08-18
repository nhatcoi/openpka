import { db } from '@/lib/db';

export class TuitionService {
  /**
   * Get all tuition credit rates with associated programs.
   */
  static async getTuitionRates(academicYear?: string) {
    return db.tuitionCreditRate.findMany({
      where: academicYear ? { academic_year: academicYear } : {},
      include: {
        Program: true,
        Major: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get tuition credit rate by program ID and academic year.
   */
  static async getRateByProgram(programId: bigint, academicYear?: string) {
    return db.tuitionCreditRate.findFirst({
      where: {
        program_id: programId,
        ...(academicYear ? { academic_year: academicYear } : {}),
      },
      include: {
        Program: true,
        Major: true,
      },
    });
  }
}
