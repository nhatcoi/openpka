import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Prisma, TuitionCreditRate } from '@prisma/client'

import { authOptions } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { academicYearRegex, calculateMinTuition, formatDecimal } from '@/lib/finance/tuition'

const ratePayloadSchema = z.object({
  majorId: z.coerce.bigint(),
  programId: z.coerce.bigint().optional(),
  academicYear: z
    .string()
    .regex(academicYearRegex, 'Academic year must follow format YYYY-YYYY'),
  perCreditFee: z.coerce.number().positive(),
  currency: z
    .string()
    .trim()
    .length(3)
    .optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  note: z
    .string()
    .max(500)
    .optional(),
  force: z.boolean().optional(),
})

function serializeRate(rate: TuitionCreditRate) {
  return {
    id: rate.id.toString(),
    major_id: rate.major_id.toString(),
    program_id: rate.program_id ? rate.program_id.toString() : null,
    academic_year: rate.academic_year,
    per_credit_fee: rate.per_credit_fee.toString(),
    currency: rate.currency,
    status: rate.status,
  }
}

async function fetchActiveRates(where: Parameters<typeof db.tuitionCreditRate.findMany>[0]['where']) {
  return db.tuitionCreditRate.findMany({
    where,
    include: {
      Major: {
        select: { name_vi: true, total_credits_min: true },
      },
      Program: {
        select: { name_vi: true, total_credits: true },
      },
    },
    orderBy: { updated_at: 'desc' },
  })
}

function parseDate(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_DATE')
  }
  return date
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const academicYear = searchParams.get('year') ?? undefined
  const majorId = searchParams.get('majorId')
  const programId = searchParams.get('programId')

  try {
    if (academicYear && !academicYearRegex.test(academicYear)) {
      return NextResponse.json({ error: 'Invalid academic year' }, { status: 400 })
    }

    const whereClause: Parameters<typeof fetchActiveRates>[0] = {
      status: 'active',
      ...(academicYear ? { academic_year: academicYear } : {}),
      ...(majorId ? { major_id: BigInt(majorId) } : {}),
      ...(programId ? { program_id: BigInt(programId) } : {}),
    }

    const rates = await fetchActiveRates(whereClause)

    const data = rates.map((rate) => {
      const totalCredits = rate.Program?.total_credits ?? rate.Major.total_credits_min ?? 0
      return {
        id: rate.id.toString(),
        academicYear: rate.academic_year,
        perCreditFee: formatDecimal(rate.per_credit_fee),
        currency: rate.currency ?? 'VND',
        major: {
          id: rate.major_id.toString(),
          name: rate.Major.name_vi,
        },
        program: rate.Program
          ? {
              id: rate.program_id?.toString() ?? null,
              name: rate.Program.name_vi,
            }
          : null,
        minTuition: calculateMinTuition(rate.per_credit_fee, totalCredits),
        totalCredits,
        updatedAt: rate.updated_at,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to load tuition rates', error)
    return NextResponse.json({ error: 'Không thể tải dữ liệu học phí' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canManage = session.user.permissions?.includes('finance.manageTuition')
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: z.infer<typeof ratePayloadSchema>
  try {
    payload = ratePayloadSchema.parse(await request.json())
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload', details: error }, { status: 400 })
  }

  const { majorId, programId, academicYear, perCreditFee, currency, effectiveFrom, effectiveTo, note, force } =
    payload

  try {
    const [major, program] = await Promise.all([
      db.major.findUnique({
        where: { id: majorId },
        select: { id: true, name_vi: true, total_credits_min: true, status: true },
      }),
      programId
        ? db.program.findUnique({
            where: { id: programId },
            select: { id: true, name_vi: true, total_credits: true, status: true },
          })
        : null,
    ])

    if (!major) {
      return NextResponse.json({ error: 'Ngành/CTĐT không tồn tại' }, { status: 404 })
    }

    if (programId && !program) {
      return NextResponse.json({ error: 'Chương trình đào tạo không tồn tại' }, { status: 404 })
    }

    const baseWhere = {
      academic_year: academicYear,
      status: 'active' as const,
      ...(programId ? { program_id: programId } : { program_id: null, major_id: majorId }),
    }

    const existingRate = await db.tuitionCreditRate.findFirst({
      where: baseWhere,
    })

    if (existingRate && !force) {
      return NextResponse.json(
        {
          error: 'Đơn giá đã tồn tại. Bạn có muốn cập nhật?',
          code: 'RATE_EXISTS',
          rateId: existingRate.id.toString(),
        },
        { status: 409 },
      )
    }

    const actorId = BigInt(session.user.id)
    const effectiveFromDate = parseDate(effectiveFrom)
    const effectiveToDate = parseDate(effectiveTo)

    const perCreditDecimal = new Prisma.Decimal(perCreditFee)

    const newRate = await db.$transaction(async (tx) => {
      if (existingRate) {
        await tx.tuitionCreditRate.update({
          where: { id: existingRate.id },
          data: { status: 'archived', updated_by: actorId },
        })

        await tx.tuitionRateLog.create({
          data: {
            tuition_rate_id: existingRate.id,
            action: 'ARCHIVE',
            old_value: serializeRate(existingRate),
            new_value: null,
            changed_by: actorId,
            note: 'Auto archive before creating new rate',
          },
        })
      }

      const created = await tx.tuitionCreditRate.create({
        data: {
          major_id: majorId,
          program_id: programId ?? null,
          academic_year: academicYear,
          per_credit_fee: perCreditDecimal,
          currency: currency?.toUpperCase() ?? 'VND',
          effective_from: effectiveFromDate,
          effective_to: effectiveToDate,
          note,
          created_by: actorId,
          updated_by: actorId,
        },
      })

      await tx.tuitionRateLog.create({
        data: {
          tuition_rate_id: created.id,
          action: existingRate ? 'UPDATE' : 'CREATE',
          old_value: existingRate ? serializeRate(existingRate) : null,
          new_value: serializeRate(created),
          changed_by: actorId,
          note,
        },
      })

      return created
    })

    const totalCredits = program?.total_credits ?? major.total_credits_min ?? 0
    const minTuition = calculateMinTuition(newRate.per_credit_fee, totalCredits)

    return NextResponse.json(
      {
        data: {
          id: newRate.id.toString(),
          academicYear,
          perCreditFee: formatDecimal(newRate.per_credit_fee),
          currency: newRate.currency ?? 'VND',
          major: { id: major.id.toString(), name: major.name_vi },
          program: program ? { id: program.id.toString(), name: program.name_vi } : null,
          totalCredits,
          minTuition,
          effectiveFrom: newRate.effective_from,
          effectiveTo: newRate.effective_to,
        },
      },
      { status: existingRate ? 200 : 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return NextResponse.json({ error: 'Ngày hiệu lực không hợp lệ' }, { status: 400 })
    }
    console.error('Failed to create tuition rate', error)
    return NextResponse.json({ error: 'Không thể lưu dữ liệu học phí' }, { status: 500 })
  }
}

