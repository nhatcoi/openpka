import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  withBody,
  withErrorHandling,
  createErrorResponse,
} from '@/lib/api/api-handler';
import {
  DEFAULT_PROGRAM_PAGE_SIZE,
  ProgramPriority,
  ProgramStatus,
  normalizeProgramPriority,
  normalizeProgramBlockTypeForDb,
} from '@/constants/programs';
import { CreateProgramInput } from '@/lib/api/schemas/program';

const LIST_CONTEXT = 'lấy danh sách chương trình đào tạo';
const CREATE_CONTEXT = 'tạo chương trình đào tạo';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(
    parseInt(searchParams.get('limit') || String(DEFAULT_PROGRAM_PAGE_SIZE), 10),
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
        Major: {
          select: {
            id: true,
            code: true,
            name_vi: true,
            name_en: true,
          },
        },
        ProgramCourseMap: {
          select: {
            id: true,
            course_id: true,
            block_id: true,
            is_required: true,
            display_order: true,
          },
        },
        _count: {
          select: {
            StudentAcademicProgress: true,
          },
        },
      } as any,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const items = programs.map((program) => ({
    id: program.id.toString(),
    code: program.code,
    name_vi: program.name_vi,
    name_en: program.name_en,
    description: program.description,
    status: (program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
    total_credits: program.total_credits,
    version: program.version,
    effective_from: program.effective_from,
    effective_to: program.effective_to,
    orgUnit: (program as any).OrgUnit
      ? {
          id: (program as any).OrgUnit.id.toString(),
          code: (program as any).OrgUnit.code,
          name: (program as any).OrgUnit.name,
        }
      : null,
    major: (program as any).Major
      ? {
          id: (program as any).Major.id.toString(),
          code: (program as any).Major.code,
          name_vi: (program as any).Major.name_vi,
          name_en: (program as any).Major.name_en,
        }
      : null,
    stats: {
      student_count: (program as any)._count?.StudentAcademicProgress || 0,
      block_count: (program as any).ProgramCourseMap?.length || 0,
      course_count: (program as any).ProgramCourseMap?.length || 0,
    },
    created_at: program.created_at,
    updated_at: program.updated_at,
  }));

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

export const POST = withBody(async (body: unknown) => {
  const data = body as CreateProgramInput;

  if (!data?.code || !data?.name_vi) {
    throw new Error('Missing required fields: code, name_vi');
  }

  const now = new Date();
  const userId = BigInt(1);

  const orgUnitId = data.org_unit_id ? BigInt(Number(data.org_unit_id)) : null;
  const majorId = data.major_id ? BigInt(Number(data.major_id)) : null;

  if (data.org_unit_id != null && data.org_unit_id !== '') {
    if (orgUnitId) {
      const exists = await (db as any).orgUnit.findUnique({
        where: { id: orgUnitId },
        select: { id: true },
      });
      if (!exists) {
        throw new Error('Không tìm thấy đơn vị tổ chức (org_unit_id)');
      }
    }
  }

  // Uniqueness pre-check for (major_id, version)
  const version = data.version || String(now.getFullYear());
  // Uniqueness pre-check for code
  if (data.code) {
    const codeDup = await db.program.findUnique({ where: { code: data.code } });
    if (codeDup) {
      throw new Error('Mã chương trình đã tồn tại');
    }
  }
  if (majorId) {
    const dup = await db.program.findFirst({
      where: { major_id: majorId, version },
      select: { id: true },
    });
    if (dup) {
      throw new Error('Đã tồn tại chương trình cùng ngành (major) và phiên bản (version)');
    }
  }
  const result = await db.$transaction(async (tx) => {
    // Normalize PLO: accept array or object; save as object { items: [...] }
    const incomingPlo = (data as any).plo;
    // Accept three shapes:
    // 1) plain object map { PLO1: ".." }
    // 2) array -> convert to object map PLO1..n
    // 3) { items: [...] } -> flatten to object map
    const toObjectMap = (val: unknown): Record<string, string> | undefined => {
      if (!val) return undefined;
      if (Array.isArray(val)) {
        const map: Record<string, string> = {};
        val.forEach((item, idx) => {
          let label = '';
          if (item && typeof item === 'object') {
            const r = item as any;
            label = (r.label ?? r.description_vi ?? r.description ?? '').toString().trim();
          } else if (typeof item === 'string') {
            label = item.trim();
          }
          if (label) map[`PLO${idx + 1}`] = label;
        });
        return Object.keys(map).length ? map : undefined;
      }
      if (typeof val === 'object') {
        const anyVal = val as any;
        if (Array.isArray(anyVal.items)) return toObjectMap(anyVal.items);
        const entries = Object.entries(val as Record<string, unknown>)
          .reduce((acc, [k, v]) => {
            const label = (v ?? '').toString().trim();
            if (label) acc[k] = label;
            return acc;
          }, {} as Record<string, string>);
        return Object.keys(entries).length ? entries : undefined;
      }
      return undefined;
    };
    const normalizedPlo = toObjectMap(incomingPlo);
    const program = await tx.program.create({
      data: {
        code: data.code,
        name_vi: data.name_vi,
        name_en: data.name_en || null,
        description: data.description || null,
        version,
        total_credits: data.total_credits ?? 120,
        status: data.status || ProgramStatus.DRAFT,
        org_unit_id: orgUnitId,
        major_id: majorId,
        plo: normalizedPlo,
        effective_from: data.effective_from ? new Date(data.effective_from) : null,
        effective_to: data.effective_to ? new Date(data.effective_to) : null,
        created_at: now,
        updated_at: now,
        created_by: userId,
        updated_by: userId,
      },
      include: {
        OrgUnit: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    let blockCount = 0;
    let courseCount = 0;

    // Assign provided templates (legacy path)
    if (Array.isArray((data as any).block_templates) && (data as any).block_templates.length > 0) {
      for (let index = 0; index < (data as any).block_templates.length; index += 1) {
        const templateInput = (data as any).block_templates[index];
        const numericTemplateId = Number(templateInput.template_id);
        if (Number.isNaN(numericTemplateId)) continue;

        await (tx as any).programCourseMap.create({
          data: {
            program_id: program.id,
            block_id: BigInt(numericTemplateId),
            display_order: templateInput.display_order ? Math.max(1, templateInput.display_order) : index + 1,
            is_required: templateInput.is_required ?? true,
            custom_title: templateInput.custom_title?.trim(),
            custom_description: templateInput.custom_description?.trim(),
          },
        });
        blockCount += 1;
      }
    }

    // Note: standalone_courses are now handled through template assignments
    // If you need standalone courses, create a special template for them

    return { program, blockCount, courseCount };
  });

  return {
    id: result.program.id,
    code: result.program.code,
    name_vi: result.program.name_vi,
    name_en: result.program.name_en,
    description: result.program.description,
    status: (result.program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
    total_credits: result.program.total_credits,
    version: result.program.version,
    effective_from: result.program.effective_from,
    effective_to: result.program.effective_to,
    priority: normalizeProgramPriority(data.priority || ProgramPriority.MEDIUM),
    org_unit_id: orgUnitId ?? null,
    major_id: majorId ?? null,
    orgUnit: (result.program as any).OrgUnit
      ? {
          id: (result.program as any).OrgUnit.id,
          code: (result.program as any).OrgUnit.code,
          name: (result.program as any).OrgUnit.name,
        }
      : null,
    major: null,
    stats: {
      student_count: 0,
      block_count: result.blockCount,
      course_count: result.courseCount,
    },
    created_at: result.program.created_at ?? now,
    updated_at: result.program.updated_at ?? now,
  };
}, CREATE_CONTEXT);
