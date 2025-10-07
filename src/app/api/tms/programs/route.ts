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

const LIST_CONTEXT = 'fetch programs';
const CREATE_CONTEXT = 'create program';

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
        _count: {
          select: {
            StudentAcademicProgress: true,
            ProgramBlock: true,
            ProgramCourseMap: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const items = programs.map((program) => ({
    id: program.id,
    code: program.code,
    name_vi: program.name_vi,
    name_en: program.name_en,
    description: program.description,
    status: (program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
    total_credits: program.total_credits,
    version: program.version,
    effective_from: program.effective_from,
    effective_to: program.effective_to,
    priority: ProgramPriority.MEDIUM,
    orgUnit: program.OrgUnit
      ? {
          id: program.OrgUnit.id,
          code: program.OrgUnit.code,
          name: program.OrgUnit.name,
        }
      : null,
    major: null,
    stats: {
      student_count: program._count.StudentAcademicProgress,
      block_count: program._count.ProgramBlock,
      course_count: program._count.ProgramCourseMap,
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

  const orgUnitId = data.org_unit_id
    ? BigInt(Number(data.org_unit_id))
    : null;
  const majorId = data.major_id ? BigInt(Number(data.major_id)) : null;
  const result = await db.$transaction(async (tx) => {
    const program = await tx.program.create({
      data: {
        code: data.code,
        name_vi: data.name_vi,
        name_en: data.name_en || null,
        description: data.description || null,
        version: data.version || String(now.getFullYear()),
        total_credits: data.total_credits ?? 120,
        status: data.status || ProgramStatus.DRAFT,
        org_unit_id: orgUnitId,
        major_id: majorId,
        plo: data.plo || null,
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

    if (Array.isArray(data.blocks) && data.blocks.length > 0) {
      for (let index = 0; index < data.blocks.length; index += 1) {
        const blockInput = data.blocks[index];
        const createdBlock = await tx.programBlock.create({
          data: {
            program_id: program.id,
            code: blockInput.code?.trim() || `BLOCK-${index + 1}`,
            title: blockInput.title?.trim() || `Khối học phần ${index + 1}`,
            block_type: normalizeProgramBlockTypeForDb(blockInput.block_type),
            display_order: blockInput.display_order ? Math.max(1, blockInput.display_order) : index + 1,
          },
        });
        blockCount += 1;

        if (Array.isArray(blockInput.courses)) {
          for (let courseIndex = 0; courseIndex < blockInput.courses.length; courseIndex += 1) {
            const courseInput = blockInput.courses[courseIndex];
            const numericCourseId = Number(courseInput.course_id);
            if (Number.isNaN(numericCourseId)) continue;

            await tx.programCourseMap.create({
              data: {
                program_id: program.id,
                course_id: BigInt(numericCourseId),
                block_id: createdBlock.id,
                is_required: courseInput.is_required ?? true,
                display_order:
                  courseInput.display_order != null
                    ? Math.max(1, courseInput.display_order)
                    : courseIndex + 1,
              },
            });
            courseCount += 1;
          }
        }
      }
    }

    if (Array.isArray(data.standalone_courses) && data.standalone_courses.length > 0) {
      for (let index = 0; index < data.standalone_courses.length; index += 1) {
        const courseInput = data.standalone_courses[index];
        const numericCourseId = Number(courseInput.course_id);
        if (Number.isNaN(numericCourseId)) continue;

        await tx.programCourseMap.create({
          data: {
            program_id: program.id,
            course_id: BigInt(numericCourseId),
            block_id: null,
            is_required: courseInput.is_required ?? true,
            display_order:
              courseInput.display_order != null
                ? Math.max(1, courseInput.display_order)
                : index + 1,
          },
        });
        courseCount += 1;
      }
    }

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
    orgUnit: result.program.OrgUnit
      ? {
          id: result.program.OrgUnit.id,
          code: result.program.OrgUnit.code,
          name: result.program.OrgUnit.name,
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
