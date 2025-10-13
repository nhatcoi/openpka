import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const COPY_CONTEXT = 'sao chép cấu trúc chương trình đào tạo';

interface CopyStructureInput {
  source_program_id: string | number;
  target_program_id: string | number;
}

/**
 * POST /api/tms/programs/copy-structure
 * Sao chép toàn bộ cấu trúc ProgramCourseMap từ chương trình nguồn sang chương trình đích
 */
export const POST = withBody(async (body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const input = body as CopyStructureInput;

  if (!input.source_program_id || !input.target_program_id) {
    throw new Error('Thiếu source_program_id hoặc target_program_id');
  }

  const sourceProgramId = BigInt(input.source_program_id as any);
  const targetProgramId = BigInt(input.target_program_id as any);

  // Kiểm tra cả hai program tồn tại
  const [sourceProgram, targetProgram] = await Promise.all([
    db.program.findUnique({
      where: { id: sourceProgramId },
      select: { id: true, code: true, name_vi: true },
    }),
    db.program.findUnique({
      where: { id: targetProgramId },
      select: { id: true, code: true, name_vi: true },
    }),
  ]);

  if (!sourceProgram) {
    throw new Error(`Không tìm thấy chương trình nguồn với ID: ${input.source_program_id}`);
  }
  if (!targetProgram) {
    throw new Error(`Không tìm thấy chương trình đích với ID: ${input.target_program_id}`);
  }

  // Lấy tất cả ProgramCourseMap từ chương trình nguồn
  const sourceMappings = await db.programCourseMap.findMany({
    where: { program_id: sourceProgramId },
    include: {
      Course: {
        select: { id: true, code: true, name_vi: true },
      },
      ProgramBlock: {
        select: { id: true, code: true, title: true },
      },
      ProgramBlockGroup: {
        select: { id: true, code: true, title: true },
      },
    },
    orderBy: [
      { block_id: 'asc' },
      { display_order: 'asc' },
    ],
  });

  if (sourceMappings.length === 0) {
    throw new Error('Chương trình nguồn không có cấu trúc học phần nào để sao chép');
  }

  // Xóa các mapping cũ của program đích (nếu có)
  await db.programCourseMap.deleteMany({
    where: { program_id: targetProgramId },
  });

  // Sao chép các mapping sang program đích
  const newMappings = sourceMappings.map((mapping) => ({
    program_id: targetProgramId,
    course_id: mapping.course_id,
    block_id: mapping.block_id,
    group_id: mapping.group_id,
    is_required: mapping.is_required,
    display_order: mapping.display_order,
  }));

  // Tạo tất cả mappings mới
  const result = await db.programCourseMap.createMany({
    data: newMappings,
    skipDuplicates: true, // Tránh lỗi nếu có duplicate
  });

  // Lấy danh sách đã tạo để trả về
  const createdMappings = await db.programCourseMap.findMany({
    where: { program_id: targetProgramId },
    include: {
      Course: {
        select: { id: true, code: true, name_vi: true, credits: true },
      },
      ProgramBlock: {
        select: { id: true, code: true, title: true },
      },
      ProgramBlockGroup: {
        select: { id: true, code: true, title: true },
      },
    },
    orderBy: [
      { block_id: 'asc' },
      { display_order: 'asc' },
    ],
  });

  return {
    success: true,
    message: `Đã sao chép ${result.count} học phần từ chương trình "${sourceProgram.code}" sang "${targetProgram.code}"`,
    source_program: {
      id: sourceProgram.id.toString(),
      code: sourceProgram.code,
      name_vi: sourceProgram.name_vi,
    },
    target_program: {
      id: targetProgram.id.toString(),
      code: targetProgram.code,
      name_vi: targetProgram.name_vi,
    },
    copied_count: result.count,
    mappings: createdMappings.map((m) => ({
      id: m.id.toString(),
      courseId: m.course_id.toString(),
      blockId: m.block_id?.toString() || null,
      groupId: m.group_id?.toString() || null,
      isRequired: Boolean(m.is_required),
      displayOrder: m.display_order ?? 1,
      course: m.Course
        ? {
            id: m.Course.id.toString(),
            code: m.Course.code,
            nameVi: m.Course.name_vi || '',
            credits: m.Course.credits != null ? Number(m.Course.credits) : 0,
          }
        : null,
      block: m.ProgramBlock
        ? {
            id: m.ProgramBlock.id.toString(),
            code: m.ProgramBlock.code,
            title: m.ProgramBlock.title,
          }
        : null,
      group: m.ProgramBlockGroup
        ? {
            id: m.ProgramBlockGroup.id.toString(),
            code: m.ProgramBlockGroup.code,
            title: m.ProgramBlockGroup.title,
          }
        : null,
    })),
  };
}, COPY_CONTEXT);

