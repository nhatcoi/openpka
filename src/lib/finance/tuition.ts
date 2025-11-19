import { Prisma } from '@prisma/client'

export const academicYearRegex = /^\d{4}-\d{4}$/

export function formatDecimal(value: Prisma.Decimal | number): number {
  if (typeof value === 'number') {
    return value
  }
  return Number(value.toString())
}

export function calculateMinTuition(perCreditFee: Prisma.Decimal | number, totalCredits?: number | null): number {
  const credits = totalCredits ?? 0
  if (credits <= 0) {
    return 0
  }
  return formatDecimal(perCreditFee) * credits
}

