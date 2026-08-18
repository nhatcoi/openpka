import { Decimal } from '@prisma/client/runtime/library'

export const academicYearRegex = /^\d{4}-\d{4}$/

export function formatDecimal(value: Decimal | number): number {
  if (typeof value === 'number') {
    return value
  }
  return Number(value.toString())
}

export function calculateMinTuition(perCreditFee: Decimal | number, totalCredits?: number | null): number {
  const credits = totalCredits ?? 0
  if (credits <= 0) {
    return 0
  }
  return formatDecimal(perCreditFee) * credits
}

export function getCurrentAcademicYear(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

export function buildYearOptions(range: number = 5): string[] {
  const current = getCurrentAcademicYear();
  const [start] = current.split('-').map(Number);
  return Array.from({ length: range }, (_, idx) => {
    const yearStart = start - idx;
    return `${yearStart}-${yearStart + 1}`;
  });
}


