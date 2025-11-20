import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth';
import { calculateMinTuition, formatDecimal } from '@/lib/finance/tuition';

const querySchema = z.object({
  studentId: z.coerce.bigint(),
  programId: z.coerce.bigint().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const canView = session.user.permissions?.includes('finance.viewTuition');
  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let parsed;
  try {
    parsed = querySchema.parse({
      studentId: searchParams.get('studentId'),
      programId: searchParams.get('programId'),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { studentId, programId } = parsed;

  try {
    const progress = await db.studentAcademicProgress.findFirst({
      where: {
        student_id: studentId,
        ...(programId ? { program_id: programId } : {}),
      },
      include: {
        programs: {
          select: {
            id: true,
            name_vi: true,
            code: true,
            total_credits: true,
            Major: {
              select: {
                id: true,
                name_vi: true,
                code: true,
                total_credits_min: true,
              },
            },
          },
        },
        Cohort: {
          select: {
            id: true,
            name: true,
            academic_year: true,
          },
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { error: 'Không tìm thấy tiến độ học tập của sinh viên' },
        { status: 404 }
      );
    }

    const program = progress.programs;
    if (!program) {
      return NextResponse.json(
        { error: 'Sinh viên chưa được gán vào chương trình đào tạo' },
        { status: 404 }
      );
    }

    const creditsEarned = progress.credits_earned ?? 0;
    const creditsRequired = progress.credits_required ?? program.total_credits ?? program.Major?.total_credits_min ?? 120;
    const creditsRemaining = Math.max(0, creditsRequired - creditsEarned);

    const currentYear = new Date();
    const startYear = currentYear.getMonth() >= 6 ? currentYear.getFullYear() : currentYear.getFullYear() - 1;
    const academicYear = `${startYear}-${startYear + 1}`;

    const tuitionRate = await db.tuitionCreditRate.findFirst({
      where: {
        status: 'active',
        academic_year: academicYear,
        OR: [
          { program_id: program.id },
          { major_id: program.Major?.id ?? BigInt(0), program_id: null },
        ],
      },
      orderBy: [{ program_id: 'desc' }, { created_at: 'desc' }],
    });

    if (!tuitionRate) {
      return NextResponse.json(
        {
          error: `Chưa có đơn giá học phí cho năm học ${academicYear}`,
          data: {
            studentId: progress.student_id.toString(),
            program: {
              id: program.id.toString(),
              name: program.name_vi,
              code: program.code,
            },
            creditsEarned,
            creditsRequired,
            creditsRemaining,
            academicYear,
            perCreditFee: null,
            remainingTuition: null,
            currency: null,
          },
        },
        { status: 404 }
      );
    }

    const perCreditFee = formatDecimal(tuitionRate.per_credit_fee);
    const remainingTuition = creditsRemaining * perCreditFee;

    return NextResponse.json({
      data: {
        studentId: progress.student_id.toString(),
        program: {
          id: program.id.toString(),
          name: program.name_vi,
          code: program.code,
          totalCredits: program.total_credits,
        },
        major: program.Major
          ? {
              id: program.Major.id.toString(),
              name: program.Major.name_vi,
              code: program.Major.code,
              totalCreditsMin: program.Major.total_credits_min,
            }
          : null,
        cohort: progress.Cohort
          ? {
              id: progress.Cohort.id.toString(),
              name: progress.Cohort.name,
              academicYear: progress.Cohort.academic_year,
            }
          : null,
        creditsEarned,
        creditsRequired,
        creditsRemaining,
        academicYear,
        perCreditFee,
        remainingTuition,
        currency: tuitionRate.currency ?? 'VND',
        gpa: progress.cumulative_gpa ? formatDecimal(progress.cumulative_gpa) : null,
        status: progress.status,
        enrollmentDate: progress.enrollment_date,
        expectedGraduationDate: progress.expected_graduation_date,
      },
    });
  } catch (error) {
    console.error('Failed to calculate completion tuition', error);
    return NextResponse.json(
      { error: 'Không thể tính học phí hoàn thành CTĐT' },
      { status: 500 }
    );
  }
}

