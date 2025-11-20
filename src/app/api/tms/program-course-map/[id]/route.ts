import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withIdAndBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';
import { UpdateProgramCourseMapInput } from '@/lib/api/schemas/program-course-map';

const UPDATE_CONTEXT = 'cập nhật bản đồ học phần của chương trình';
const DELETE_CONTEXT = 'xóa bản đồ học phần của chương trình';

export const PUT = withIdAndBody(async (idParam: string, body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const id = BigInt(idParam);

  const input = body as UpdateProgramCourseMapInput;

  const data: any = {};
  if (input.block_id !== undefined) {
    data.block_id = input.block_id == null || input.block_id === 'null' ? null : BigInt(input.block_id as any);
  }
  if (input.is_required !== undefined) {
    data.is_required = Boolean(input.is_required);
  }
  if (input.display_order !== undefined && input.display_order !== null && input.display_order !== '') {
    data.display_order = Number(input.display_order);
  }

  const updated = await db.programCourseMap.update({
    where: { id },
    data,
    include: {
      Course: { select: { id: true, code: true, name_vi: true, name_en: true, credits: true, type: true } },
      ProgramBlock: { select: { id: true, code: true, title: true } },
    },
  });

  return {
    id: updated.id.toString(),
    programId: updated.program_id.toString(),
    courseId: updated.course_id.toString(),
    blockId: updated.block_id != null ? updated.block_id.toString() : null,
    isRequired: Boolean(updated.is_required),
    displayOrder: updated.display_order ?? 1,
    course: updated.Course
      ? {
          id: updated.Course.id.toString(),
          code: updated.Course.code,
          nameVi: updated.Course.name_vi || undefined,
          nameEn: updated.Course.name_en || undefined,
          credits: updated.Course.credits != null ? Number(updated.Course.credits) : undefined,
          type: updated.Course.type || undefined,
        }
      : null,
    block: updated.ProgramBlock
      ? { id: updated.ProgramBlock.id.toString(), code: updated.ProgramBlock.code, title: updated.ProgramBlock.title }
      : null,
  };
}, UPDATE_CONTEXT);

export const DELETE = withErrorHandling(async (_req: NextRequest, ctx?: { params?: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const idParam = ctx?.params ? (await ctx.params).id : undefined;
  if (!idParam) throw new Error('Thiếu id');
  const id = BigInt(idParam);

  await db.programCourseMap.delete({ where: { id } });

  return { id: id.toString() };
}, DELETE_CONTEXT);


