import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import {
  createErrorResponse,
  withIdAndBody,
  withIdParam,
} from '@/lib/api/api-handler';
import { UpdateProgramCourseMapInput } from '@/lib/api/schemas/program-course-map';

const DETAIL_CONTEXT = 'fetch program course map detail';
const UPDATE_CONTEXT = 'update program course map';
const DELETE_CONTEXT = 'delete program course map';

const includeRelations = {
  Course: {
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      credits: true,
      type: true,
    },
  },
  ProgramBlock: {
    select: {
      id: true,
      code: true,
      title: true,
    },
  },
} satisfies Prisma.ProgramCourseMapInclude;

export const GET = withIdParam(async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const mapIdNumber = Number(id);
  if (Number.isNaN(mapIdNumber)) {
    throw new Error('Invalid id');
  }

  const mapping = await db.programCourseMap.findUnique({
    where: { id: BigInt(mapIdNumber) },
    include: includeRelations,
  });

  if (!mapping) {
    throw new Error('Program course mapping not found');
  }

  return {
    id: mapping.id,
    programId: mapping.program_id,
    blockId: mapping.block_id,
    courseId: mapping.course_id,
    isRequired: mapping.is_required ?? true,
    displayOrder: mapping.display_order ?? 1,
    course: mapping.Course
      ? {
          id: mapping.Course.id,
          code: mapping.Course.code,
          nameVi: mapping.Course.name_vi,
          nameEn: mapping.Course.name_en,
          credits: mapping.Course.credits,
          type: mapping.Course.type,
        }
      : null,
    block: mapping.ProgramBlock
      ? {
          id: mapping.ProgramBlock.id,
          code: mapping.ProgramBlock.code,
          title: mapping.ProgramBlock.title,
        }
      : null,
  };
}, DETAIL_CONTEXT);

export const PUT = withIdAndBody(async (id: string, body: unknown, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const mapIdNumber = Number(id);
  if (Number.isNaN(mapIdNumber)) {
    throw new Error('Invalid id');
  }

  const payload = body as UpdateProgramCourseMapInput;

  const data: Prisma.ProgramCourseMapUpdateInput = {};

  if (payload.block_id !== undefined) {
    if (payload.block_id === null || payload.block_id === 'null') {
      data.block_id = null;
    } else {
      const blockIdNumber = Number(payload.block_id);
      if (Number.isNaN(blockIdNumber)) {
        throw new Error('Invalid block_id');
      }
      data.block_id = BigInt(blockIdNumber);
    }
  }

  if (payload.is_required !== undefined) {
    data.is_required = payload.is_required;
  }

  if (payload.display_order !== undefined) {
    const orderNumber = Number(payload.display_order);
    if (Number.isNaN(orderNumber) || orderNumber <= 0) {
      throw new Error('Invalid display_order');
    }
    data.display_order = orderNumber;
  }

  if (payload.program_id !== undefined) {
    const programIdNumber = Number(payload.program_id);
    if (Number.isNaN(programIdNumber)) {
      throw new Error('Invalid program_id');
    }
    data.program_id = BigInt(programIdNumber);
  }

  if (payload.course_id !== undefined) {
    const courseIdNumber = Number(payload.course_id);
    if (Number.isNaN(courseIdNumber)) {
      throw new Error('Invalid course_id');
    }
    data.course_id = BigInt(courseIdNumber);
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No fields to update');
  }

  const updated = await db.programCourseMap.update({
    where: { id: BigInt(mapIdNumber) },
    data,
    include: includeRelations,
  });

  return {
    id: updated.id,
    programId: updated.program_id,
    blockId: updated.block_id,
    courseId: updated.course_id,
    isRequired: updated.is_required ?? true,
    displayOrder: updated.display_order ?? 1,
    course: updated.Course
      ? {
          id: updated.Course.id,
          code: updated.Course.code,
          nameVi: updated.Course.name_vi,
          nameEn: updated.Course.name_en,
          credits: updated.Course.credits,
          type: updated.Course.type,
        }
      : null,
    block: updated.ProgramBlock
      ? {
          id: updated.ProgramBlock.id,
          code: updated.ProgramBlock.code,
          title: updated.ProgramBlock.title,
        }
      : null,
  };
}, UPDATE_CONTEXT);

export const DELETE = withIdParam(async (id: string, request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  void request;

  const mapIdNumber = Number(id);
  if (Number.isNaN(mapIdNumber)) {
    throw new Error('Invalid id');
  }

  await db.programCourseMap.delete({ where: { id: BigInt(mapIdNumber) } });

  return { id: BigInt(mapIdNumber) };
}, DELETE_CONTEXT);
