import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';
import {
  CurriculumStatus,
  DEFAULT_CURRICULUM_PAGE_SIZE,
  normalizeCurriculumStatus,
} from '@/constants/curriculum';
import { WorkflowStatus } from '@/constants/workflow-statuses';

const LIST_CONTEXT = 'fetch curriculum overview';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(
    parseInt(searchParams.get('limit') || String(DEFAULT_CURRICULUM_PAGE_SIZE), 10),
    1,
  );
  const status = searchParams.get('status') || undefined;
  const orgUnitId = searchParams.get('orgUnitId') || undefined;
  const search = searchParams.get('search') || undefined;

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (orgUnitId) {
    const parsedOrgUnit = Number(orgUnitId);
    if (!Number.isNaN(parsedOrgUnit)) {
      where.org_unit_id = BigInt(parsedOrgUnit);
    }
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name_vi: { contains: search, mode: 'insensitive' } },
      { name_en: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, programs] = await Promise.all([
    db.program.count({ where }),
    db.program.findMany({
      where,
      include: {
        OrgUnit: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        curriculum_versions: {
          orderBy: [
            { effective_from: 'desc' },
            { created_at: 'desc' },
          ],
          take: 1,
        },
        _count: {
          select: {
            StudentAcademicProgress: true,
            ProgramBlock: true,
            ProgramCourseMap: true,
            curriculum_versions: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const items = programs.map((program) => {
    const latestVersion = program.curriculum_versions?.[0] || null;

    return {
      id: program.id.toString(),
      code: program.code ?? null,
      nameVi: program.name_vi ?? null,
      nameEn: program.name_en ?? null,
      status: (program.status ?? WorkflowStatus.DRAFT) as string,
      totalCredits: program.total_credits ?? null,
      version: program.version ?? null,
      orgUnit: program.OrgUnit
        ? {
            id: program.OrgUnit.id.toString(),
            code: program.OrgUnit.code,
            name: program.OrgUnit.name,
          }
        : null,
      stats: {
        blockCount: program._count?.ProgramBlock ?? 0,
        courseCount: program._count?.ProgramCourseMap ?? 0,
        studentCount: program._count?.StudentAcademicProgress ?? 0,
        curriculumVersionCount: program._count?.curriculum_versions ?? 0,
      },
      latestVersion: latestVersion
        ? {
            id: latestVersion.id.toString(),
            version: latestVersion.version,
            title: latestVersion.title,
            status: normalizeCurriculumStatus(latestVersion.status ?? CurriculumStatus.DRAFT),
            effectiveFrom: latestVersion.effective_from,
            effectiveTo: latestVersion.effective_to,
            totalCredits: latestVersion.total_credits ?? program.total_credits ?? 0,
          }
        : null,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}, LIST_CONTEXT);
