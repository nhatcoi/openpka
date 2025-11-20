import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'gán học phần hàng loạt vào chương trình';

interface BulkAssignInputCourseItem {
  course_id: number | string;
  is_required?: boolean;
  display_order?: number | string | null;
  constraints?: {
    courses: Array<{
      course_id: string;
      code: string;
      name: string;
      type: string;
    }>;
  } | null;
}

interface BulkAssignInput {
  program_id: number | string;
  block_id?: number | string | null;
  group_id?: number | string | null;
  items: BulkAssignInputCourseItem[];
}

export const POST = withBody(async (body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const payload = body as BulkAssignInput;
  if (!payload?.program_id || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Thiếu program_id hoặc danh sách học phần');
  }

  const programId = BigInt(payload.program_id as any);
  const blockId = payload.block_id == null || payload.block_id === 'null' ? null : BigInt(payload.block_id as any);
  const groupId = payload.group_id == null || payload.group_id === 'null' ? null : BigInt(payload.group_id as any);

  // Ensure program exists
  const programExists = await db.program.findUnique({ where: { id: programId }, select: { id: true } });
  if (!programExists) throw new Error('Không tìm thấy chương trình');

  // Fetch valid courses and map to bigint
  const courseIds = payload.items
    .map((i) => {
      const n = BigInt(i.course_id as any);
      return n;
    });

  const existingCourses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true },
  });
  const validCourseIdSet = new Set(existingCourses.map((c) => c.id.toString()))

  const dataToInsert = payload.items
    .filter((i) => validCourseIdSet.has(BigInt(i.course_id as any).toString()))
    .map((i, index) => ({
      program_id: programId,
      course_id: BigInt(i.course_id as any),
      block_id: blockId,
      group_id: groupId,
      is_required: i.is_required ?? true,
      display_order: i.display_order == null || i.display_order === '' ? index + 1 : Number(i.display_order),
      constraints: i.constraints || null,
    }));

  if (dataToInsert.length === 0) {
    return { inserted: 0, skipped: payload.items.length };
  }

  // Avoid unique conflicts (program_id + course_id): insert only those not existing
  const existingMappings = await db.programCourseMap.findMany({
    where: {
      program_id: programId,
      course_id: { in: dataToInsert.map((d) => d.course_id) },
    },
    select: { course_id: true },
  });
  const existingSet = new Set(existingMappings.map((m) => m.course_id.toString()));
  const filtered = dataToInsert.filter((d) => !existingSet.has(d.course_id.toString()));

  if (filtered.length === 0) {
    return { inserted: 0, skipped: payload.items.length };
  }

  await db.programCourseMap.createMany({ data: filtered });

  return { inserted: filtered.length, skipped: payload.items.length - filtered.length };
}, CONTEXT);


