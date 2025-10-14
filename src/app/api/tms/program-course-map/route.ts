import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';
import { ProgramCourseMapQueryInput, CreateProgramCourseMapInput } from '@/lib/api/schemas/program-course-map';

const LIST_CONTEXT = 'lấy bản đồ học phần của chương trình';
const CREATE_CONTEXT = 'tạo bản đồ học phần cho chương trình';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(parseInt(searchParams.get('limit') || '10', 10), 1);
  const programId = searchParams.get('programId') || undefined;
  const blockId = searchParams.get('blockId');
  const required = searchParams.get('required');
  const search = searchParams.get('search') || undefined;

  const where: any = {};

  if (programId) {
    const parsedProgramId = Number(programId);
    if (!Number.isNaN(parsedProgramId)) {
      where.program_id = BigInt(parsedProgramId);
    }
  }

  if (blockId) {
    if (blockId === 'null') {
      where.block_id = null;
    } else {
      const parsedBlockId = Number(blockId);
      if (!Number.isNaN(parsedBlockId)) {
        where.block_id = BigInt(parsedBlockId);
      }
    }
  }

  if (required && required !== 'all') {
    where.is_required = required === 'true';
  }

  const skip = (page - 1) * limit;

  const [total, mappings] = await Promise.all([
    db.programCourseMap.count({ where }),
    db.programCourseMap.findMany({
      where,
      include: {
        Course: {
          select: { id: true, code: true, name_vi: true, name_en: true, credits: true, type: true },
        },
        ProgramBlock: {
          select: { id: true, code: true, title: true },
        },
      },
      orderBy: [
        { display_order: 'asc' },
        { id: 'asc' },
      ],
      skip,
      take: limit,
    }),
  ]);

  const items = mappings.map((m) => ({
    id: m.id.toString(),
    programId: m.program_id.toString(),
    courseId: m.course_id.toString(),
    blockId: m.block_id != null ? m.block_id.toString() : null,
    isRequired: Boolean(m.is_required),
    displayOrder: m.display_order ?? 1,
    course: m.Course
      ? {
          id: m.Course.id.toString(),
          code: m.Course.code,
          nameVi: m.Course.name_vi || undefined,
          nameEn: m.Course.name_en || undefined,
          credits: m.Course.credits != null ? Number(m.Course.credits) : undefined,
          type: m.Course.type || undefined,
        }
      : null,
    block: m.ProgramBlock
      ? {
          id: m.ProgramBlock.id.toString(),
          code: m.ProgramBlock.code,
          title: m.ProgramBlock.title,
        }
      : null,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}, LIST_CONTEXT);

export const POST = withBody(async (body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const input = body as CreateProgramCourseMapInput;

  if (!input.program_id || !input.course_id) {
    throw new Error('Thiếu program_id hoặc course_id');
  }

  const programId = BigInt(input.program_id as any);
  const courseId = BigInt(input.course_id as any);
  const blockId = input.block_id == null || input.block_id === 'null' ? null : BigInt(input.block_id as any);
  const displayOrder = input.display_order == null || input.display_order === '' ? 1 : Number(input.display_order);
  const isRequired = input.is_required ?? true;

  // Ensure program and course exist
  const [program, course] = await Promise.all([
    db.program.findUnique({ where: { id: programId }, select: { id: true } }),
    db.course.findUnique({ where: { id: courseId }, select: { id: true } }),
  ]);

  if (!program) throw new Error('Không tìm thấy chương trình');
  if (!course) throw new Error('Không tìm thấy học phần');

  // Create mapping (unique per program_id + course_id)
  const created = await db.programCourseMap.create({
    data: {
      program_id: programId,
      course_id: courseId,
      block_id: blockId,
      is_required: isRequired,
      display_order: displayOrder,
    },
    include: {
      Course: { select: { id: true, code: true, name_vi: true, name_en: true, credits: true, type: true } },
      ProgramBlock: { select: { id: true, code: true, title: true } },
    },
  });

  return {
    id: created.id.toString(),
    programId: created.program_id.toString(),
    courseId: created.course_id.toString(),
    blockId: created.block_id != null ? created.block_id.toString() : null,
    isRequired: Boolean(created.is_required),
    displayOrder: created.display_order ?? 1,
    course: created.Course
      ? {
          id: created.Course.id.toString(),
          code: created.Course.code,
          nameVi: created.Course.name_vi || undefined,
          nameEn: created.Course.name_en || undefined,
          credits: created.Course.credits != null ? Number(created.Course.credits) : undefined,
          type: created.Course.type || undefined,
        }
      : null,
    block: created.ProgramBlock
      ? { id: created.ProgramBlock.id.toString(), code: created.ProgramBlock.code, title: created.ProgramBlock.title }
      : null,
  };
}, CREATE_CONTEXT);


