import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { createErrorResponse, withErrorHandling } from '@/lib/api/api-handler';
import {
  getProgramStatusLabel,
  getProgramBlockTypeLabel,
} from '@/constants/programs';
import { WorkflowStatus } from '@/constants/workflow-statuses';
import type { ReportsOverviewResponse, StatusBreakdownItem } from '@/lib/api/schemas/reports';

const CONTEXT = 'fetch tms reports overview';

const COURSE_TYPE_LABELS: Record<string, string> = {
  theory: 'Lý thuyết',
  practice: 'Thực hành',
  thesis: 'Đồ án/Khóa luận',
  internship: 'Thực tập',
  core: 'Cốt lõi',
  elective: 'Tự chọn',
};

const COURSE_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Đã phê duyệt',
  DRAFT: 'Nháp',
  REVIEWING: 'Đang duyệt',
  REJECTED: 'Từ chối',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Lưu trữ',
};

function buildStatusBreakdown(raw: { status: string | null; _count: { id: number } }[]): StatusBreakdownItem[] {
  return raw.map((item) => {
    const status = (item.status ?? 'UNKNOWN').toString();
    return {
      status,
      label: getProgramStatusLabel(status),
      count: item._count.id,
    };
  });
}

export const GET = withErrorHandling<ReportsOverviewResponse>(async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const [
    programAggregate,
    totalCourses,
    totalMajors,
    programStatusRaw,
    courseTypeRaw,
    courseStatusRaw,
    blockDistributionRaw,
    programCourseCounts,
    programs,
    recentCoursesRaw,
  ] = await Promise.all([
    db.program.aggregate({
      _count: { id: true },
      _sum: { total_credits: true },
    }),
    db.course.count(),
    db.major.count(),
    db.program.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    db.course.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
    db.course.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    db.programBlock.groupBy({
      by: ['block_type'],
      _count: { id: true },
    }),
    db.programCourseMap.groupBy({
      by: ['program_id'],
      _count: { id: true },
    }),
    db.program.findMany({
      select: {
        id: true,
        code: true,
        name_vi: true,
        name_en: true,
        status: true,
        total_credits: true,
        updated_at: true,
        org_unit_id: true,
        OrgUnit: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    }),
    db.course.findMany({
      select: {
        id: true,
        code: true,
        name_vi: true,
        status: true,
        updated_at: true,
        OrgUnit: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 8,
    }),
  ]);

  const totalPrograms = programAggregate._count?.id ?? 0;
  const totalCredits = Number(programAggregate._sum?.total_credits ?? 0);
  const totalCourseMappings = programCourseCounts.reduce((sum, item) => sum + item._count.id, 0);
  const averageCoursesPerProgram = totalPrograms > 0 ? Number((totalCourseMappings / totalPrograms).toFixed(1)) : 0;

  const programStatus = buildStatusBreakdown(programStatusRaw);

  let activePrograms = 0;
  let draftPrograms = 0;
  let pendingPrograms = 0;
  let publishedPrograms = 0;

  programStatus.forEach((item) => {
    const status = (item.status ?? '').toUpperCase();
    if (status === WorkflowStatus.APPROVED || status === WorkflowStatus.PUBLISHED) {
      activePrograms += item.count;
    }
    if (status === WorkflowStatus.DRAFT) {
      draftPrograms += item.count;
    }
    if (status === WorkflowStatus.PUBLISHED) {
      publishedPrograms += item.count;
    }
    if (status === WorkflowStatus.REVIEWING) {
      pendingPrograms += item.count;
    }
  });

  const programsByOrgUnitMap = new Map<string, {
    orgUnitId: string | null;
    orgUnitCode: string | null;
    orgUnitName: string;
    programCount: number;
  }>();

  programs.forEach((program) => {
    const key = program.org_unit_id ? program.org_unit_id.toString() : 'unassigned';
    const orgUnitId = program.OrgUnit?.id ? program.OrgUnit.id.toString() : null;
    const orgUnitCode = program.OrgUnit?.code ?? null;
    const orgUnitName = program.OrgUnit?.name ?? 'Chưa phân bổ';
    const entry = programsByOrgUnitMap.get(key) ?? {
      orgUnitId,
      orgUnitCode,
      orgUnitName,
      programCount: 0,
    };
    entry.programCount += 1;
    programsByOrgUnitMap.set(key, entry);
  });

  const programsByOrgUnit = Array.from(programsByOrgUnitMap.values())
    .sort((a, b) => b.programCount - a.programCount)
    .slice(0, 6);

  const programCourseCountMap = new Map<string, number>();
  programCourseCounts.forEach((item) => {
    programCourseCountMap.set(item.program_id.toString(), item._count.id);
  });

  const topProgramsByCourses = programs
    .map((program) => ({
      programId: program.id.toString(),
      code: program.code ?? null,
      name: program.name_vi ?? program.name_en ?? 'Chưa đặt tên',
      status: program.status ?? null,
      totalCredits: Number(program.total_credits ?? 0),
      totalCourses: programCourseCountMap.get(program.id.toString()) ?? 0,
    }))
    .sort((a, b) => {
      if (b.totalCourses === a.totalCourses) {
        return b.totalCredits - a.totalCredits;
      }
      return b.totalCourses - a.totalCourses;
    })
    .slice(0, 5);

  const topProgramsByCredits = [...programs]
    .map((program) => ({
      programId: program.id.toString(),
      code: program.code ?? null,
      name: program.name_vi ?? program.name_en ?? 'Chưa đặt tên',
      status: program.status ?? null,
      totalCredits: Number(program.total_credits ?? 0),
      totalCourses: programCourseCountMap.get(program.id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalCredits - a.totalCredits)
    .slice(0, 5);

  const recentPrograms = [...programs]
    .sort((a, b) => {
      const aTime = a.updated_at ? a.updated_at.getTime() : 0;
      const bTime = b.updated_at ? b.updated_at.getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6)
    .map((program) => ({
      programId: program.id.toString(),
      code: program.code ?? null,
      name: program.name_vi ?? program.name_en ?? 'Chưa đặt tên',
      status: program.status ?? null,
      updatedAt: program.updated_at ? program.updated_at.toISOString() : null,
      orgUnitName: program.OrgUnit?.name ?? null,
    }));

  const recentCourses = recentCoursesRaw.map((course) => ({
    courseId: course.id.toString(),
    code: course.code,
    name: course.name_vi,
    status: course.status ?? null,
    updatedAt: course.updated_at ? course.updated_at.toISOString() : null,
    orgUnitName: course.OrgUnit?.name ?? null,
  }));

  const courseTypeBreakdown = courseTypeRaw.map((item) => {
    const type = item.type ?? 'unknown';
    return {
      type,
      label: COURSE_TYPE_LABELS[type] ?? type,
      count: item._count.id,
    };
  });

  const courseStatusBreakdown = courseStatusRaw.map((item) => {
    const status = (item.status ?? 'UNKNOWN').toString();
    return {
      status,
      label: COURSE_STATUS_LABELS[status] ?? status,
      count: item._count.id,
    };
  });

  const blockDistribution = blockDistributionRaw.map((item) => {
    const blockType = item.block_type ?? 'other';
    return {
      blockType,
      label: getProgramBlockTypeLabel(blockType),
      count: item._count.id,
    };
  });

  return {
    summary: {
      totalPrograms,
      activePrograms,
      draftPrograms,
      pendingPrograms,
      publishedPrograms,
      totalCourses,
      totalMajors,
      totalCredits,
      averageCoursesPerProgram,
    },
    programStatus,
    programsByOrgUnit,
    courseTypeBreakdown,
    courseStatusBreakdown,
    blockDistribution,
    topProgramsByCourses,
    topProgramsByCredits,
    recentPrograms,
    recentCourses,
  };
}, CONTEXT);
