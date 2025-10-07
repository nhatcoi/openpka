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
import { CreateProgramBlockGroupRuleInput } from '@/lib/api/schemas/program-block-group';

const LIST_CONTEXT = 'fetch program block group rules';
const CREATE_CONTEXT = 'create program block group rule';

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
  const groupIdParam = searchParams.get('groupId');

  const where: Prisma.ProgramBlockGroupRuleWhereInput = {};

  if (groupIdParam) {
    const groupIdNumber = Number(groupIdParam);
    if (!Number.isNaN(groupIdNumber)) {
      where.group_id = BigInt(groupIdNumber);
    }
  }

  const rules = await db.programBlockGroupRule.findMany({
    where,
    orderBy: { id: 'asc' },
  });

  const items = rules.map((rule) => ({
    id: rule.id,
    groupId: rule.group_id,
    minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
    maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
    minCourses: rule.min_courses ?? null,
    maxCourses: rule.max_courses ?? null,
  }));

  return {
    items,
    total: items.length,
  };
}, LIST_CONTEXT);

export const POST = withBody(async (body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const payload = body as CreateProgramBlockGroupRuleInput;

  if (!payload?.group_id) {
    throw new Error('Missing required field: group_id');
  }

  const groupIdNumber = Number(payload.group_id);
  if (Number.isNaN(groupIdNumber)) {
    throw new Error('Invalid group_id');
  }

  const group = await db.programBlockGroup.findUnique({ where: { id: BigInt(groupIdNumber) } });
  if (!group) {
    throw new Error('Program block group not found');
  }

  const minCredits = parseNullableNumber(payload.min_credits);
  const maxCredits = parseNullableNumber(payload.max_credits);
  const minCourses = parseNullableNumber(payload.min_courses);
  const maxCourses = parseNullableNumber(payload.max_courses);

  const rule = await db.programBlockGroupRule.create({
    data: {
      group_id: group.id,
      min_credits: minCredits,
      max_credits: maxCredits,
      min_courses: minCourses != null ? Math.max(0, Math.floor(minCourses)) : null,
      max_courses: maxCourses != null ? Math.max(0, Math.floor(maxCourses)) : null,
    },
  });

  return {
    id: rule.id,
    groupId: rule.group_id,
    minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
    maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
    minCourses: rule.min_courses ?? null,
    maxCourses: rule.max_courses ?? null,
  };
}, CREATE_CONTEXT);
