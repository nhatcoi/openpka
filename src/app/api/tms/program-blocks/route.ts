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
  ProgramBlockType,
  PROGRAM_BLOCK_TYPES,
  normalizeProgramBlockType,
} from '@/constants/programs';
import { CreateProgramBlockInput } from '@/lib/api/schemas/program-block';

const LIST_CONTEXT = 'fetch program blocks';
const CREATE_CONTEXT = 'create program block';

const DEFAULT_BLOCK_PAGE_SIZE = 10;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(
    parseInt(searchParams.get('limit') || String(DEFAULT_BLOCK_PAGE_SIZE), 10),
    1,
  );
  const programIdParam = searchParams.get('programId');
  const search = searchParams.get('search')?.trim() || undefined;
  const blockTypeParam = searchParams.get('blockType')?.trim().toLowerCase();

  const where: Prisma.ProgramBlockWhereInput = {};

  if (programIdParam && programIdParam !== 'all') {
    const programIdNumber = Number(programIdParam);
    if (!Number.isNaN(programIdNumber)) {
      where.program_id = BigInt(programIdNumber);
    }
  }

  if (blockTypeParam && (PROGRAM_BLOCK_TYPES as string[]).includes(blockTypeParam)) {
    where.block_type = blockTypeParam;
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, blocks] = await Promise.all([
    db.programBlock.count({ where }),
    db.programBlock.findMany({
      where,
      include: {
        Program: {
          select: {
            id: true,
            code: true,
            name_vi: true,
          },
        },
        _count: {
          select: {
            ProgramCourseMap: true,
            ProgramBlockGroup: true,
          },
        },
      },
      orderBy: [
        { program_id: 'asc' },
        { display_order: 'asc' },
        { code: 'asc' },
      ],
      skip,
      take: limit,
    }),
  ]);

  const items = blocks.map((block) => ({
    id: block.id,
    programId: block.program_id,
    program: block.Program
      ? {
          id: block.Program.id,
          code: block.Program.code,
          name: block.Program.name_vi,
        }
      : null,
    code: block.code,
    title: block.title,
    blockType: block.block_type as ProgramBlockType,
    displayOrder: block.display_order,
    courseCount: block._count.ProgramCourseMap,
    groupCount: block._count.ProgramBlockGroup,
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

export const POST = withBody(async (body: unknown, _request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void _request;

  const payload = body as CreateProgramBlockInput;

  if (!payload?.program_id || !payload.code || !payload.title) {
    throw new Error('Missing required fields: program_id, code, title');
  }

  const programIdNumber = Number(payload.program_id);
  if (Number.isNaN(programIdNumber)) {
    throw new Error('Invalid program_id');
  }

  const sanitizedCode = payload.code.trim();
  const sanitizedTitle = payload.title.trim();
  const blockType = normalizeProgramBlockType(payload.block_type);

  if (!sanitizedCode || !sanitizedTitle) {
    throw new Error('Code and title cannot be empty');
  }

  const explicitDisplayOrder =
    payload.display_order != null && payload.display_order !== ''
      ? Number(payload.display_order)
      : undefined;

  if (explicitDisplayOrder !== undefined && Number.isNaN(explicitDisplayOrder)) {
    throw new Error('Invalid display_order');
  }

  const programId = BigInt(programIdNumber);

  const nextDisplayOrder =
    explicitDisplayOrder && explicitDisplayOrder > 0
      ? explicitDisplayOrder
      : ((await db.programBlock.aggregate({
          where: { program_id: programId },
          _max: { display_order: true },
        }))._max.display_order || 0) + 1;

  try {
    const block = await db.programBlock.create({
      data: {
        program_id: programId,
        code: sanitizedCode,
        title: sanitizedTitle,
        block_type: blockType,
        display_order: nextDisplayOrder,
      },
      include: {
        Program: {
          select: {
            id: true,
            code: true,
            name_vi: true,
          },
        },
      },
    });

    return {
      id: block.id,
      programId: block.program_id,
      program: block.Program
        ? {
            id: block.Program.id,
            code: block.Program.code,
            name: block.Program.name_vi,
          }
        : null,
      code: block.code,
      title: block.title,
      blockType: block.block_type as ProgramBlockType,
      displayOrder: block.display_order,
      courseCount: 0,
      groupCount: 0,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('Mã khối học phần đã tồn tại trong chương trình');
    }
    throw error;
  }
}, CREATE_CONTEXT);
