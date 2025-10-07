import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  createErrorResponse,
  withBody,
  withErrorHandling,
} from '@/lib/api/api-handler';
import {
  CreateProgramCourseMapInput,
} from '@/lib/api/schemas/program-course-map';

const LIST_CONTEXT = 'fetch program course map';
const CREATE_CONTEXT = 'create program course map';

const DEFAULT_PAGE_SIZE = 10;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10), 1);
  const programIdParam = searchParams.get('programId');
  const blockIdParam = searchParams.get('blockId');
  const requiredParam = searchParams.get('required');
  const search = searchParams.get('search')?.trim();

  const where: Prisma.ProgramCourseMapWhereInput = {};

  if (programIdParam && programIdParam !== 'all') {
    const programId = Number(programIdParam);
    if (!Number.isNaN(programId)) {
      where.program_id = BigInt(programId);
    }
  }

  if (blockIdParam && blockIdParam !== 'all') {
    const blockId = Number(blockIdParam);
    if (!Number.isNaN(blockId)) {
      where.block_id = BigInt(blockId);
    } else if (blockIdParam === 'null') {
      where.block_id = null;
    }
  }

  if (requiredParam === 'true') {
    where.is_required = true;
  } else if (requiredParam === 'false') {
    where.is_required = false;
  }

  if (search) {
    where.Course = {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { name_vi: { contains: search, mode: 'insensitive' } },
        { name_en: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    db.programCourseMap.count({ where }),
    db.programCourseMap.findMany({
      where,
      include: {
        Course: {
          select: {
            id: true,
            code: true,
            name_vi: true,
            name_en: true,
            credits: true,
            type: true,
          },
        },
        ProgramBlock: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: [
        { program_id: 'asc' },
        { display_order: 'asc' },
        { course_id: 'asc' },
      ],
      skip,
      take: limit,
    }),
  ]);

  const mapped = items.map((item) => ({
    id: item.id,
    programId: item.program_id,
    blockId: item.block_id,
    courseId: item.course_id,
    isRequired: item.is_required ?? true,
    displayOrder: item.display_order ?? 1,
    course: item.Course
      ? {
          id: item.Course.id,
          code: item.Course.code,
          nameVi: item.Course.name_vi,
          nameEn: item.Course.name_en,
          credits: item.Course.credits,
          type: item.Course.type,
        }
      : null,
    block: item.ProgramBlock
      ? {
          id: item.ProgramBlock.id,
          code: item.ProgramBlock.code,
          title: item.ProgramBlock.title,
        }
      : null,
  }));

  return {
    items: mapped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}, LIST_CONTEXT);

export const POST = withBody(async (body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const payload = body as CreateProgramCourseMapInput;

  if (!payload?.program_id || !payload.course_id) {
    throw new Error('Missing required fields: program_id, course_id');
  }

  const programIdNumber = Number(payload.program_id);
  const courseIdNumber = Number(payload.course_id);

  if (Number.isNaN(programIdNumber) || Number.isNaN(courseIdNumber)) {
    throw new Error('Invalid program_id or course_id');
  }

  const programId = BigInt(programIdNumber);
  const courseId = BigInt(courseIdNumber);

  if (payload.block_id && payload.block_id !== 'null') {
    const blockIdNumber = Number(payload.block_id);
    if (Number.isNaN(blockIdNumber)) {
      throw new Error('Invalid block_id');
    }

    const block = await db.programBlock.findUnique({
      where: { id: BigInt(blockIdNumber) },
      select: { program_id: true },
    });

    if (!block || block.program_id !== programId) {
      throw new Error('Khối học phần không thuộc chương trình đã chọn');
    }
  }

  const existing = await db.programCourseMap.findUnique({
    where: {
      program_id_course_id: {
        program_id: programId,
        course_id: courseId,
      },
    },
  });

  if (existing) {
    throw new Error('Học phần này đã được thêm vào chương trình');
  }

  const explicitDisplayOrder =
    payload.display_order != null && payload.display_order !== ''
      ? Number(payload.display_order)
      : undefined;

  if (explicitDisplayOrder !== undefined && Number.isNaN(explicitDisplayOrder)) {
    throw new Error('Invalid display_order');
  }

  const nextOrder =
    explicitDisplayOrder && explicitDisplayOrder > 0
      ? explicitDisplayOrder
      : ((await db.programCourseMap.aggregate({
          where: { program_id: programId },
          _max: { display_order: true },
        }))._max.display_order || 0) + 1;

  const blockId =
    payload.block_id && payload.block_id !== 'null'
      ? BigInt(Number(payload.block_id))
      : null;

  const created = await db.programCourseMap.create({
    data: {
      program_id: programId,
      course_id: courseId,
      block_id: blockId,
      is_required: payload.is_required ?? true,
      display_order: nextOrder,
    },
    include: {
      Course: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          name_en: true,
          credits: true,
          type: true,
        },
      },
      ProgramBlock: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });

  return {
    id: created.id,
    programId: created.program_id,
    courseId: created.course_id,
    blockId: created.block_id,
    isRequired: created.is_required ?? true,
    displayOrder: created.display_order ?? nextOrder,
    course: created.Course
      ? {
          id: created.Course.id,
          code: created.Course.code,
          nameVi: created.Course.name_vi,
          nameEn: created.Course.name_en,
          credits: created.Course.credits,
          type: created.Course.type,
        }
      : null,
    block: created.ProgramBlock
      ? {
          id: created.ProgramBlock.id,
          code: created.ProgramBlock.code,
          title: created.ProgramBlock.title,
        }
      : null,
  };
}, CREATE_CONTEXT);
