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
    major: program.major_id ? { id: program.major_id.toString() } : null,
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
  let majorId = data.major_id ? BigInt(Number(data.major_id)) : null;

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

  if (data.major_id != null && data.major_id !== '') {
    if (majorId) {
      try {
        const exists = await db.major.findUnique({
          where: { id: majorId },
          select: { id: true },
        });
        if (!exists) {
          throw new Error('Không tìm thấy chuyên ngành (major_id)');
        }
      } catch (error: any) {
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          majorId = null;
        } else {
          throw error;
        }
      }
    }
  }

  const version = data.version || String(now.getFullYear());
  
  // Check code uniqueness
  if (data.code) {
    const codeDup = await db.program.findUnique({ where: { code: data.code } });
    if (codeDup) {
      throw new Error('Mã chương trình đã tồn tại');
    }
  }
  // Simple PLO normalization
  const plo = (data as any).plo;
  const normalizedPlo = plo ? (typeof plo === 'object' ? plo : { PLO1: plo }) : undefined;
  
  let program;
  try {
    program = await db.program.create({
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
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('majors') || error.message?.includes('does not exist')) {
      program = await db.program.create({
        data: {
          code: data.code,
          name_vi: data.name_vi,
          name_en: data.name_en || null,
          description: data.description || null,
          version,
          total_credits: data.total_credits ?? 120,
          status: data.status || ProgramStatus.DRAFT,
          org_unit_id: orgUnitId,
          major_id: null,
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
    } else if (error.message?.includes('Unique constraint failed')) {
      throw new Error('Đã có chương trình đã tồn tại trong Khoa và ngành này, vui lòng kiểm tra và chọn khác');
    } else {
      throw error;
    }
  }

  let blockCount = 0;
  let courseCount = 0;

  if (Array.isArray((data as any).block_templates) && (data as any).block_templates.length > 0) {
    for (let index = 0; index < (data as any).block_templates.length; index += 1) {
      const templateInput = (data as any).block_templates[index];
      const numericTemplateId = Number(templateInput.template_id);
      if (Number.isNaN(numericTemplateId)) continue;

      await db.programCourseMap.create({
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

  const result = { program, blockCount, courseCount };


  // Sao chép cấu trúc từ chương trình khác nếu được chỉ định
  let copiedCount = 0;
  if ((data as any).copy_from_program_id) {
    try {
      const sourceProgramId = BigInt((data as any).copy_from_program_id);
      
      // Lấy tất cả ProgramCourseMap từ chương trình nguồn
      const sourceMappings = await db.programCourseMap.findMany({
        where: { program_id: sourceProgramId },
        select: {
          course_id: true,
          block_id: true,
          group_id: true,
          is_required: true,
          display_order: true,
        },
        orderBy: [
          { block_id: 'asc' },
          { display_order: 'asc' },
        ],
      });

      if (sourceMappings.length > 0) {
        // Sao chép các mapping sang program mới
        const newMappings = sourceMappings.map((mapping) => ({
          program_id: result.program.id,
          course_id: mapping.course_id,
          block_id: mapping.block_id,
          group_id: mapping.group_id,
          is_required: mapping.is_required,
          display_order: mapping.display_order,
        }));

        const copyResult = await db.programCourseMap.createMany({
          data: newMappings,
          skipDuplicates: true,
        });

        copiedCount = copyResult.count;
      }
    } catch (copyError) {
      console.error('Failed to copy program structure:', copyError);
      // Không throw error, chỉ log để không làm gián đoạn việc tạo program
    }
  }

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
    major_id: majorId,
    orgUnit: (result.program as any).OrgUnit
      ? {
          id: (result.program as any).OrgUnit.id,
          code: (result.program as any).OrgUnit.code,
          name: (result.program as any).OrgUnit.name,
        }
      : null,
    major: majorId ? { id: majorId.toString() } : null,
    stats: {
      student_count: 0,
      block_count: result.blockCount,
      course_count: copiedCount > 0 ? copiedCount : result.courseCount,
    },
    created_at: result.program.created_at ?? now,
    updated_at: result.program.updated_at ?? now,
    copied_structure_from: (data as any).copy_from_program_id || null,
    copied_course_count: copiedCount,
  };
}, CREATE_CONTEXT);
