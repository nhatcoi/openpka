import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'áp dụng khung chương trình chuẩn';

export const POST = withBody(async (body: unknown, _req?: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const data = body as { program_id?: number | string };
  const programIdNum = Number(data.program_id);
  if (!programIdNum || Number.isNaN(programIdNum)) {
    throw new Error('Thiếu hoặc sai program_id');
  }

  const programId = BigInt(programIdNum);

  await db.$transaction(async (tx) => {
    // Ensure program exists
    const exists = await tx.program.findUnique({ where: { id: programId }, select: { id: true } });
    if (!exists) throw new Error('Không tìm thấy chương trình đào tạo');

    const pairs: Array<{ blockId: number; groupId?: number; order?: number; required?: boolean }> = [
      { blockId: 3, groupId: 1 },
      { blockId: 5, groupId: 1 },
      { blockId: 4, groupId: 1 },
      { blockId: 4, groupId: 2 },
      { blockId: 2, groupId: 1 },
      { blockId: 2, groupId: 2 },
      { blockId: 2, groupId: 3 },
      { blockId: 2, groupId: 4 },
      { blockId: 6, groupId: 5 },
    ];

    // Lấy một số học phần mẫu để gán tạm (đảm bảo course_id NOT NULL)
    const sampleCourses = await (tx as any).course.findMany({
      select: { id: true },
      take: Math.max(10, pairs.length),
      orderBy: { id: 'asc' },
    });
    if (!Array.isArray(sampleCourses) || sampleCourses.length === 0) {
      throw new Error('Không tìm thấy học phần mẫu để gán vào khung');
    }

    for (let i = 0; i < pairs.length; i += 1) {
      const p = pairs[i];
      const required = p.required ?? true;
      const order = p.order ?? i + 1;
      const courseId = (sampleCourses[i % sampleCourses.length] as any).id as bigint;
      await (tx as any).$executeRawUnsafe(
        `INSERT INTO academic.program_course_map (program_id, block_id, group_id, course_id, is_required, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        programId,
        BigInt(p.blockId),
        p.groupId ? BigInt(p.groupId) : null,
        courseId,
        required,
        order,
      );
    }
  });

  return { ok: true };
}, CONTEXT);


