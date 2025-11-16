import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/api-permissions';
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
} from '@/constants/programs';
import { CreateProgramInput } from '@/lib/api/schemas/program';

const LIST_CONTEXT = 'lấy danh sách chương trình đào tạo';
const CREATE_CONTEXT = 'tạo chương trình đào tạo';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }
  
  // Check permission
  requirePermission(session, 'tms.program.view');

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
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const items = programs.map((program: any) => ({
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
    orgUnit: program.OrgUnit
      ? {
          id: program.OrgUnit.id.toString(),
          code: program.OrgUnit.code,
          name: program.OrgUnit.name,
        }
      : null,
    major: program.major_id ? { id: program.major_id.toString() } : null,
    stats: {
      student_count: program._count?.StudentAcademicProgress || 0,
      block_count: program.ProgramCourseMap?.length || 0,
      course_count: program.ProgramCourseMap?.length || 0,
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

/**
 * Validate và chuẩn hóa dữ liệu đầu vào
 */
function validateAndNormalizeInput(data: CreateProgramInput) {
  if (!data?.code || !data?.name_vi) {
    throw new Error('Missing required fields: code, name_vi');
  }

  const orgUnitId = data.org_unit_id ? BigInt(Number(data.org_unit_id)) : null;
  const majorId = data.major_id ? BigInt(Number(data.major_id)) : null;
  const version = data.version || String(new Date().getFullYear());
  const plo = data.plo
    ? (typeof data.plo === 'object' ? (data.plo as Record<string, unknown>) : { PLO1: data.plo })
    : undefined;

  return { orgUnitId, majorId, version, plo };
}

/**
 * Validate org_unit_id và major_id tồn tại trong database
 */
async function validateReferences(orgUnitId: bigint | null, majorId: bigint | null) {
  if (orgUnitId) {
    const orgUnit = await db.orgUnit.findUnique({
      where: { id: orgUnitId },
      select: { id: true },
    });
    if (!orgUnit) {
      throw new Error('Không tìm thấy đơn vị tổ chức (org_unit_id)');
    }
  }

  if (majorId) {
    try {
      const major = await db.major.findUnique({
        where: { id: majorId },
        select: { id: true },
      });
      if (!major) {
        throw new Error(`Không tìm thấy chuyên ngành với ID: ${majorId}`);
      }
    } catch (error: any) {
      if (error.code === 'P2021') {
        throw new Error(
          'Lỗi cấu hình Prisma: Không thể truy cập bảng majors. ' +
          'Vui lòng chạy: npx prisma generate và khởi động lại server.'
        );
      }
      throw error;
    }
  }
}

/**
 * Xử lý lỗi khi tạo program
 */
function handleProgramCreationError(error: any, version: string): never {
  if (error.code === 'P2021') {
    throw new Error(
      `Lỗi cấu hình database: ${error.message || 'Table does not exist'}. ` +
      'Vui lòng kiểm tra lại database connection và chạy: npx prisma generate'
    );
  }

  if (error.code === 'P2002') {
    const target = error.meta?.target || [];
    if (Array.isArray(target)) {
      if (target.includes('code')) {
        throw new Error('Mã chương trình đã tồn tại. Vui lòng chọn mã khác.');
      }
      if (target.includes('major_id') || target.includes('version')) {
        throw new Error(
          `Đã có chương trình đào tạo với version "${version}" và chuyên ngành này. ` +
          'Vui lòng chọn version khác hoặc chuyên ngành khác.'
        );
      }
    }
    throw new Error('Đã có chương trình đào tạo tương tự. Vui lòng kiểm tra và chọn khác.');
  }

  throw new Error(
    `Lỗi khi tạo chương trình đào tạo: ${error.message || 'Unknown error'}. ` +
    'Vui lòng kiểm tra lại dữ liệu đầu vào.'
  );
}

/**
 * Tạo course mappings từ block_templates
 */
async function createCourseMappings(
  programId: bigint,
  blockTemplates: Array<{
    template_id?: string | number;
    block_id?: string | number;
    course_id?: string | number;
    group_id?: string | number;
    display_order?: number;
    is_required?: boolean;
  }>
): Promise<{ blockCount: number; courseCount: number }> {
  if (!Array.isArray(blockTemplates) || blockTemplates.length === 0) {
    return { blockCount: 0, courseCount: 0 };
  }

  // Fetch sample courses as fallback
  let sampleCourses: Array<{ id: bigint }> = [];
  try {
    sampleCourses = await db.course.findMany({
      select: { id: true },
      take: Math.max(10, blockTemplates.length),
      orderBy: { id: 'asc' },
    });
  } catch {
    // Ignore error, will skip templates without course_id
  }

  let blockCount = 0;
  let courseCount = 0;

  for (let index = 0; index < blockTemplates.length; index += 1) {
    const template = blockTemplates[index];
    const templateId = Number(template.template_id || template.block_id);

    if (Number.isNaN(templateId)) continue;

    // Determine course_id (required)
    let courseId: bigint | null = null;
    if (template.course_id) {
      courseId = BigInt(Number(template.course_id));
    } else if (sampleCourses.length > 0) {
      courseId = sampleCourses[index % sampleCourses.length].id;
    } else {
      continue; // Skip if no course_id available
    }

    // Determine block_id (optional)
    const blockId = template.block_id
      ? BigInt(Number(template.block_id))
      : templateId
        ? BigInt(templateId)
        : null;

    try {
      await db.programCourseMap.create({
        data: {
          program_id: programId,
          course_id: courseId,
          block_id: blockId || undefined,
          group_id: template.group_id ? BigInt(Number(template.group_id)) : undefined,
          display_order: template.display_order ? Math.max(1, template.display_order) : index + 1,
          is_required: template.is_required ?? true,
        },
      });
      if (blockId) blockCount += 1;
      courseCount += 1;
    } catch (mapError: any) {
      // Skip if duplicate, log other errors
      if (mapError.code !== 'P2002' && process.env.NODE_ENV === 'development') {
        console.error('Failed to create course mapping:', mapError);
      }
    }
  }

  return { blockCount, courseCount };
}

/**
 * Sao chép cấu trúc từ chương trình khác
 */
async function copyProgramStructure(
  targetProgramId: bigint,
  sourceProgramId: bigint
): Promise<number> {
  try {
    const sourceMappings = await db.programCourseMap.findMany({
      where: { program_id: sourceProgramId },
      select: {
        course_id: true,
        block_id: true,
        group_id: true,
        is_required: true,
        display_order: true,
        constraints: true,
      } as any,
      orderBy: [{ block_id: 'asc' }, { display_order: 'asc' }],
    });

    if (sourceMappings.length === 0) {
      return 0;
    }

    const newMappings = sourceMappings.map((mapping: any) => ({
      program_id: targetProgramId,
      course_id: mapping.course_id,
      block_id: mapping.block_id,
      group_id: mapping.group_id,
      is_required: mapping.is_required,
      display_order: mapping.display_order,
      constraints: mapping.constraints ?? null,
    }));

    const result = await db.programCourseMap.createMany({
      data: newMappings,
      skipDuplicates: true,
    });

    return result.count;
  } catch {
    return 0;
  }
}

export const POST = withBody(async (body: unknown) => {
  const data = body as CreateProgramInput;
  const { orgUnitId, majorId, version, plo } = validateAndNormalizeInput(data);
  const now = new Date();
  const userId = BigInt(1);

  // Validate references
  await validateReferences(orgUnitId, majorId);

  // Check code uniqueness
  const existingProgram = await db.program.findUnique({ where: { code: data.code } });
  if (existingProgram) {
    throw new Error('Mã chương trình đã tồn tại');
  }

  // Create program
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
        plo: plo as any,
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
    handleProgramCreationError(error, version);
    return; // Never reached, but satisfies TypeScript
  }

  if (!program) {
    throw new Error('Failed to create program');
  }

  // Create course mappings
  const { blockCount, courseCount } = await createCourseMappings(
    program.id,
    (data as any).block_templates || []
  );

  // Copy structure from another program if specified
  const copyFromProgramId = (data as any).copy_from_program_id;
  const copiedCount = copyFromProgramId
    ? await copyProgramStructure(program.id, BigInt(Number(copyFromProgramId)))
    : 0;

  return {
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
    priority: normalizeProgramPriority(data.priority || ProgramPriority.MEDIUM),
    org_unit_id: orgUnitId?.toString() ?? null,
    major_id: majorId?.toString() ?? null,
    orgUnit: (program as any).OrgUnit
      ? {
          id: (program as any).OrgUnit.id.toString(),
          code: (program as any).OrgUnit.code,
          name: (program as any).OrgUnit.name,
        }
      : null,
    major: majorId ? { id: majorId.toString() } : null,
    stats: {
      student_count: 0,
      block_count: blockCount,
      course_count: copiedCount > 0 ? copiedCount : courseCount,
    },
    created_at: program.created_at ?? now,
    updated_at: program.updated_at ?? now,
    copied_structure_from: copyFromProgramId?.toString() || null,
    copied_course_count: copiedCount,
  };
}, CREATE_CONTEXT);
