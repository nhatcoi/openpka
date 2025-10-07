import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  createErrorResponse,
  withIdAndBody,
  withIdParam,
} from '@/lib/api/api-handler';
import {
  ProgramBlockType,
  normalizeProgramBlockType,
} from '@/constants/programs';
import { UpdateProgramBlockInput } from '@/lib/api/schemas/program-block';

const DETAIL_CONTEXT = 'fetch program block detail';
const UPDATE_CONTEXT = 'update program block';
const DELETE_CONTEXT = 'delete program block';

const programBlockInclude = {
  Program: {
    select: {
      id: true,
      code: true,
      name_vi: true,
    },
  },
  ProgramCourseMap: {
    orderBy: {
      display_order: 'asc' as const,
    },
    include: {
      Course: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          credits: true,
        },
      },
    },
  },
  _count: {
    select: {
      ProgramCourseMap: true,
      ProgramBlockGroup: true,
    },
  },
} satisfies Prisma.ProgramBlockInclude;

async function fetchProgramBlockDetail(id: bigint) {
  return db.programBlock.findUnique({
    where: { id },
    include: programBlockInclude,
  });
}

type ProgramBlockDetail = NonNullable<
  Awaited<
    ReturnType<typeof fetchProgramBlockDetail>
  >
>;

function mapProgramBlockDetail(block: ProgramBlockDetail) {
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
    courseCount: block._count?.ProgramCourseMap ?? 0,
    groupCount: block._count?.ProgramBlockGroup ?? 0,
    courses: block.ProgramCourseMap.map((course) => ({
      id: course.Course?.id ?? course.id,
      mapId: course.id,
      courseId: course.course_id,
      code: course.Course?.code ?? '—',
      name: course.Course?.name_vi ?? 'Chưa đặt tên',
      credits: course.Course?.credits ?? 0,
      required: course.is_required ?? true,
      displayOrder: course.display_order ?? 1,
    })),
  };
}

export const GET = withIdParam(async (id: string, _request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void _request;

  const blockIdNumber = Number(id);
  if (Number.isNaN(blockIdNumber)) {
    throw new Error('Invalid program block id');
  }

  const block = await fetchProgramBlockDetail(BigInt(blockIdNumber));
  if (!block) {
    throw new Error('Program block not found');
  }

  return mapProgramBlockDetail(block);
}, DETAIL_CONTEXT);

export const PUT = withIdAndBody(async (id: string, body: unknown, _request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void _request;

  const blockIdNumber = Number(id);
  if (Number.isNaN(blockIdNumber)) {
    throw new Error('Invalid program block id');
  }

  const payload = body as UpdateProgramBlockInput;

  const data: Prisma.ProgramBlockUpdateInput = {};

  if (payload.code !== undefined) {
    const code = payload.code?.toString().trim();
    if (!code) throw new Error('Code cannot be empty');
    data.code = code;
  }

  if (payload.title !== undefined) {
    const title = payload.title?.toString().trim();
    if (!title) throw new Error('Title cannot be empty');
    data.title = title;
  }

  if (payload.block_type !== undefined) {
    data.block_type = normalizeProgramBlockType(payload.block_type);
  }

  if (payload.program_id !== undefined) {
    const programIdNumber = Number(payload.program_id);
    if (Number.isNaN(programIdNumber)) {
      throw new Error('Invalid program_id');
    }
    data.program_id = BigInt(programIdNumber);
  }

  if (payload.display_order !== undefined) {
    const displayOrder = Number(payload.display_order);
    if (Number.isNaN(displayOrder) || displayOrder <= 0) {
      throw new Error('Invalid display_order');
    }
    data.display_order = displayOrder;
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No fields to update');
  }

  const blockId = BigInt(blockIdNumber);

  const updated = await db.programBlock.update({
    where: { id: blockId },
    data,
    include: programBlockInclude,
  });

  return mapProgramBlockDetail(updated as ProgramBlockDetail);
}, UPDATE_CONTEXT);

export const DELETE = withIdParam(async (id: string, _request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void _request;

  const blockIdNumber = Number(id);
  if (Number.isNaN(blockIdNumber)) {
    throw new Error('Invalid program block id');
  }

  const blockId = BigInt(blockIdNumber);

  const block = await db.programBlock.findUnique({
    where: { id: blockId },
    include: {
      _count: {
        select: {
          ProgramCourseMap: true,
          ProgramBlockGroup: true,
        },
      },
    },
  });

  if (!block) {
    throw new Error('Program block not found');
  }

  if ((block._count?.ProgramCourseMap ?? 0) > 0) {
    throw new Error('Không thể xóa khối học phần khi vẫn còn học phần được gắn.');
  }

  if ((block._count?.ProgramBlockGroup ?? 0) > 0) {
    throw new Error('Không thể xóa khối học phần khi vẫn còn nhóm khối học phần.');
  }

  await db.programBlock.delete({ where: { id: blockId } });

  return { id: block.id };
}, DELETE_CONTEXT);
