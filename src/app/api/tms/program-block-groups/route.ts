import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  createErrorResponse,
  withBody,
  withErrorHandling,
} from '@/lib/api/api-handler';
import { getProgramBlockGroupBaseType, normalizeProgramBlockGroupType } from '@/constants/programs';
import {
  CreateProgramBlockGroupInput,
} from '@/lib/api/schemas/program-block-group';

const LIST_CONTEXT = 'fetch program block groups';
const CREATE_CONTEXT = 'create program block group';

const DEFAULT_PAGE_SIZE = 10;

const parseNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric;
};

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
  const groupTypeParam = searchParams.get('groupType');
  const search = searchParams.get('search')?.trim();

  const where: Prisma.ProgramBlockGroupWhereInput = {};

  if (blockIdParam && blockIdParam !== 'all') {
    const blockIdNumber = Number(blockIdParam);
    if (!Number.isNaN(blockIdNumber)) {
      where.block_id = BigInt(blockIdNumber);
    }
  }

  if (programIdParam && programIdParam !== 'all') {
    const programIdNumber = Number(programIdParam);
    if (!Number.isNaN(programIdNumber)) {
      where.ProgramBlock = {
        ...(where.ProgramBlock || {}),
        program_id: BigInt(programIdNumber),
      };
    }
  }

  if (groupTypeParam && groupTypeParam !== 'all') {
    const base = getProgramBlockGroupBaseType(groupTypeParam);
    switch (base) {
      case 'elective':
        where.group_type = { startsWith: 'ELECTIVE' };
        break;
      case 'required':
        where.group_type = { startsWith: 'REQUIRED' };
        break;
      case 'core':
        where.group_type = { startsWith: 'CORE' };
        break;
      default:
        where.group_type = {
          notIn: ['ELECTIVE', 'REQUIRED', 'CORE'],
        };
        break;
    }
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, groups] = await Promise.all([
    db.programBlockGroup.count({ where }),
    db.programBlockGroup.findMany({
      where,
      include: {
        ProgramBlock: {
          select: {
            id: true,
            code: true,
            title: true,
            block_type: true,
            program_id: true,
          },
        },
        ProgramBlockGroupRule: {
          select: {
            id: true,
            min_credits: true,
            max_credits: true,
            min_courses: true,
            max_courses: true,
          },
          orderBy: { id: 'asc' },
        },
        _count: {
          select: {
            ProgramBlockGroupRule: true,
            ProgramCourseMap: true,
          },
        },
      },
      orderBy: [
        { block_id: 'asc' },
        { display_order: 'asc' },
        { code: 'asc' },
      ],
      skip,
      take: limit,
    }),
  ]);

  const items = groups.map((group) => ({
    id: group.id,
    blockId: group.block_id,
    programId: group.ProgramBlock?.program_id ?? null,
    code: group.code,
    title: group.title,
    groupType: getProgramBlockGroupBaseType(group.group_type),
    rawGroupType: group.group_type,
    displayOrder: group.display_order,
    block: group.ProgramBlock
      ? {
          id: group.ProgramBlock.id,
          code: group.ProgramBlock.code,
          title: group.ProgramBlock.title,
          blockType: group.ProgramBlock.block_type,
        }
      : null,
    ruleCount: group._count?.ProgramBlockGroupRule ?? 0,
    courseCount: group._count?.ProgramCourseMap ?? 0,
    rules: group.ProgramBlockGroupRule.map((rule) => ({
      id: rule.id,
      minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
      maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
      minCourses: rule.min_courses ?? null,
      maxCourses: rule.max_courses ?? null,
    })),
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

export const POST = withBody(async (body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const payload = body as CreateProgramBlockGroupInput;

  if (!payload?.block_id || !payload.code || !payload.title) {
    throw new Error('Missing required fields: block_id, code, title');
  }

  const blockIdNumber = Number(payload.block_id);
  if (Number.isNaN(blockIdNumber)) {
    throw new Error('Invalid block_id');
  }

  const block = await db.programBlock.findUnique({
    where: { id: BigInt(blockIdNumber) },
    select: {
      id: true,
      code: true,
      title: true,
      block_type: true,
      program_id: true,
    },
  });

  if (!block) {
    throw new Error('Program block not found');
  }

  const explicitDisplayOrder = parseNullableNumber(payload.display_order);

  if (explicitDisplayOrder !== null && Number.isNaN(explicitDisplayOrder)) {
    throw new Error('Invalid display_order');
  }

  const nextOrder =
    explicitDisplayOrder && explicitDisplayOrder > 0
      ? explicitDisplayOrder
      : ((await db.programBlockGroup.aggregate({
          where: { block_id: block.id },
          _max: { display_order: true },
        }))._max.display_order || 0) + 1;

  const group = await db.programBlockGroup.create({
    data: {
      block_id: block.id,
      code: payload.code.trim(),
      title: payload.title.trim(),
      group_type: normalizeProgramBlockGroupType(payload.group_type),
      display_order: nextOrder,
    },
    include: {
      ProgramBlock: {
        select: {
          id: true,
          code: true,
          title: true,
          block_type: true,
          program_id: true,
        },
      },
      ProgramBlockGroupRule: true,
      _count: {
        select: {
          ProgramBlockGroupRule: true,
          ProgramCourseMap: true,
        },
      },
    },
  });

  return {
    id: group.id,
    blockId: group.block_id,
    programId: group.ProgramBlock?.program_id ?? null,
    code: group.code,
    title: group.title,
    groupType: getProgramBlockGroupBaseType(group.group_type),
    rawGroupType: group.group_type,
    displayOrder: group.display_order,
    block: group.ProgramBlock
      ? {
          id: group.ProgramBlock.id,
          code: group.ProgramBlock.code,
          title: group.ProgramBlock.title,
          blockType: group.ProgramBlock.block_type,
        }
      : null,
    ruleCount: group._count?.ProgramBlockGroupRule ?? 0,
    courseCount: group._count?.ProgramCourseMap ?? 0,
    rules: group.ProgramBlockGroupRule.map((rule) => ({
      id: rule.id,
      minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
      maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
      minCourses: rule.min_courses ?? null,
      maxCourses: rule.max_courses ?? null,
    })),
  };
}, CREATE_CONTEXT);
