import { NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { academicYearRegex, formatDecimal } from '@/lib/finance/tuition'

const querySchema = z.object({
  year: z
    .string()
    .regex(academicYearRegex)
    .optional(),
  majorId: z.coerce.bigint().optional(),
  programId: z.coerce.bigint().optional(),
  range: z.coerce.number().int().positive().max(10).default(5),
})

export async function GET(request: Request) {
  const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries())

  let parsed
  try {
    parsed = querySchema.parse({
      ...searchParams,
      majorId: searchParams.majorId,
      programId: searchParams.programId,
      range: searchParams.range,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  const { year, majorId, programId, range } = parsed

  try {
    if (programId) {
      const history = await db.programMinTuition.findMany({
        where: { program_id: programId },
        orderBy: { academic_year: 'desc' },
        take: range,
      })

      return NextResponse.json({
        data: history.map((row) => ({
          tuitionRateId: row.tuition_rate_id.toString(),
          academicYear: row.academic_year,
          majorId: row.major_id.toString(),
          majorName: row.major_name,
          programId: row.program_id ? row.program_id.toString() : null,
          programName: row.program_name,
          totalCreditsMin: row.total_credits_min,
          perCreditFee: formatDecimal(row.per_credit_fee),
          minTuition: formatDecimal(row.min_tuition),
          currency: row.currency ?? 'VND',
        })),
      })
    }

    if (majorId) {
      const history = await db.programMinTuition.findMany({
        where: { major_id: majorId },
        orderBy: { academic_year: 'desc' },
        take: range,
      })

      return NextResponse.json({
        data: history.map((row) => ({
          tuitionRateId: row.tuition_rate_id.toString(),
          academicYear: row.academic_year,
          majorId: row.major_id.toString(),
          majorName: row.major_name,
          programId: row.program_id ? row.program_id.toString() : null,
          programName: row.program_name,
          totalCreditsMin: row.total_credits_min,
          perCreditFee: formatDecimal(row.per_credit_fee),
          minTuition: formatDecimal(row.min_tuition),
          currency: row.currency ?? 'VND',
        })),
      })
    }

    const list = await db.programMinTuition.findMany({
      where: year ? { academic_year: year } : undefined,
      orderBy: [{ major_name: 'asc' }, { program_name: 'asc' }],
    })

    return NextResponse.json({
      data: list.map((row) => ({
        tuitionRateId: row.tuition_rate_id.toString(),
        academicYear: row.academic_year,
        majorId: row.major_id.toString(),
        majorName: row.major_name,
        programId: row.program_id ? row.program_id.toString() : null,
        programName: row.program_name,
        totalCreditsMin: row.total_credits_min,
        perCreditFee: formatDecimal(row.per_credit_fee),
        minTuition: formatDecimal(row.min_tuition),
        currency: row.currency ?? 'VND',
      })),
    })
  } catch (error) {
    console.error('Failed to load min tuition list', error)
    return NextResponse.json({ error: 'Không thể tải dữ liệu học phí' }, { status: 500 })
  }
}

