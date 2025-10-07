import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  createErrorResponse,
  withIdAndBody,
  withIdParam,
} from '@/lib/api/api-handler';
import { UpdateProgramBlockGroupRuleInput } from '@/lib/api/schemas/program-block-group';

const DETAIL_CONTEXT = 'fetch program block group rule detail';
const UPDATE_CONTEXT = 'update program block group rule';
const DELETE_CONTEXT = 'delete program block group rule';

const parseNullableNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric;
};

export const GET = withIdParam(async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const ruleIdNumber = Number(id);
  if (Number.isNaN(ruleIdNumber)) {
    throw new Error('Invalid id');
  }

  const rule = await db.programBlockGroupRule.findUnique({ where: { id: BigInt(ruleIdNumber) } });

  if (!rule) {
    throw new Error('Program block group rule not found');
  }

  return {
    id: rule.id,
    groupId: rule.group_id,
    minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
    maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
    minCourses: rule.min_courses ?? null,
    maxCourses: rule.max_courses ?? null,
  };
}, DETAIL_CONTEXT);

export const PUT = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const ruleIdNumber = Number(id);
  if (Number.isNaN(ruleIdNumber)) {
    throw new Error('Invalid id');
  }

  const payload = body as UpdateProgramBlockGroupRuleInput;

  const data: Record<string, unknown> = {};

  if (payload.group_id !== undefined) {
    const groupIdNumber = Number(payload.group_id);
    if (Number.isNaN(groupIdNumber)) {
      throw new Error('Invalid group_id');
    }

    const group = await db.programBlockGroup.findUnique({ where: { id: BigInt(groupIdNumber) } });
    if (!group) {
      throw new Error('Program block group not found');
    }

    data.group_id = group.id;
  }

  if (payload.min_credits !== undefined) {
    data.min_credits = parseNullableNumber(payload.min_credits);
  }

  if (payload.max_credits !== undefined) {
    data.max_credits = parseNullableNumber(payload.max_credits);
  }

  if (payload.min_courses !== undefined) {
    const minCourses = parseNullableNumber(payload.min_courses);
    data.min_courses = minCourses != null ? Math.max(0, Math.floor(minCourses)) : null;
  }

  if (payload.max_courses !== undefined) {
    const maxCourses = parseNullableNumber(payload.max_courses);
    data.max_courses = maxCourses != null ? Math.max(0, Math.floor(maxCourses)) : null;
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No fields to update');
  }

  const rule = await db.programBlockGroupRule.update({
    where: { id: BigInt(ruleIdNumber) },
    data,
  });

  return {
    id: rule.id,
    groupId: rule.group_id,
    minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
    maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
    minCourses: rule.min_courses ?? null,
    maxCourses: rule.max_courses ?? null,
  };
}, UPDATE_CONTEXT);

export const DELETE = withIdParam(async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const ruleIdNumber = Number(id);
  if (Number.isNaN(ruleIdNumber)) {
    throw new Error('Invalid id');
  }

  await db.programBlockGroupRule.delete({ where: { id: BigInt(ruleIdNumber) } });

  return { id: BigInt(ruleIdNumber) };
}, DELETE_CONTEXT);
