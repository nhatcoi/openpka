import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  createErrorResponse,
  withIdAndBody,
  withIdParam,
} from '@/lib/api/api-handler';
import { getProgramBlockGroupBaseType, normalizeProgramBlockGroupType } from '@/constants/programs';
import { UpdateProgramBlockGroupInput } from '@/lib/api/schemas/program-block-group';

const DETAIL_CONTEXT = 'fetch program block group detail';
const UPDATE_CONTEXT = 'update program block group';
const DELETE_CONTEXT = 'delete program block group';

const includeRelations = {
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
} satisfies Prisma.ProgramBlockGroupInclude;

export const GET = withIdParam(async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const groupIdNumber = Number(id);
  if (Number.isNaN(groupIdNumber)) {
    throw new Error('Invalid id');
  }

  const group = await db.programBlockGroup.findUnique({
    where: { id: BigInt(groupIdNumber) },
    include: includeRelations,
  });

  if (!group) {
    throw new Error('Program block group not found');
  }

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
}, DETAIL_CONTEXT);

export const PUT = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const groupIdNumber = Number(id);
  if (Number.isNaN(groupIdNumber)) {
    throw new Error('Invalid id');
  }

  const payload = body as UpdateProgramBlockGroupInput;

  const data: Prisma.ProgramBlockGroupUpdateInput = {};

  if (payload.code !== undefined) {
    const code = payload.code.trim();
    if (!code) throw new Error('Code cannot be empty');
    data.code = code;
  }

  if (payload.title !== undefined) {
    const title = payload.title.trim();
    if (!title) throw new Error('Title cannot be empty');
    data.title = title;
  }

  if (payload.group_type !== undefined) {
    data.group_type = normalizeProgramBlockGroupType(payload.group_type);
  }

  if (payload.display_order !== undefined) {
    const displayOrder = Number(payload.display_order);
    if (Number.isNaN(displayOrder) || displayOrder <= 0) {
      throw new Error('Invalid display_order');
    }
    data.display_order = displayOrder;
  }

  if (payload.block_id !== undefined) {
    const blockIdNumber = Number(payload.block_id);
    if (Number.isNaN(blockIdNumber)) {
      throw new Error('Invalid block_id');
    }

    const block = await db.programBlock.findUnique({
      where: { id: BigInt(blockIdNumber) },
      select: { id: true },
    });

    if (!block) {
      throw new Error('Program block not found');
    }

    data.block_id = block.id;
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No fields to update');
  }

  const group = await db.programBlockGroup.update({
    where: { id: BigInt(groupIdNumber) },
    data,
    include: includeRelations,
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
}, UPDATE_CONTEXT);

export const DELETE = withIdParam(async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const groupIdNumber = Number(id);
  if (Number.isNaN(groupIdNumber)) {
    throw new Error('Invalid id');
  }

  const group = await db.programBlockGroup.findUnique({
    where: { id: BigInt(groupIdNumber) },
    include: {
      _count: {
        select: {
          ProgramCourseMap: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error('Program block group not found');
  }

  if ((group._count?.ProgramCourseMap ?? 0) > 0) {
    throw new Error('Không thể xóa nhóm khi vẫn còn học phần thuộc nhóm.');
  }

  await db.programBlockGroup.delete({ where: { id: group.id } });

  return { id: group.id };
}, DELETE_CONTEXT);
