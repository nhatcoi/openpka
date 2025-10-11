import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'quản lý khối học phần chương trình';

// GET /api/tms/programs/blocks/[id] - Lấy chi tiết khối học phần
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const blockId = BigInt(params.id);

  // Get program block template
  const block = await db.programBlock.findUnique({
    where: { id: blockId },
    include: {
      ProgramCourseMap: {
        include: {
          Program: {
            select: {
              id: true,
              code: true,
              name_vi: true,
              name_en: true,
            }
          },
          Course: {
            select: {
              id: true,
              code: true,
              name_vi: true,
              name_en: true,
              credits: true
            }
          }
        }
      }
    }
  });

  if (!block) {
    return createErrorResponse('Not Found', 'Không tìm thấy khối học phần', 404);
  }

  // Group by program
  const programGroups = block.ProgramCourseMap.reduce((acc: any, mapping: any) => {
    const programId = mapping.program_id.toString();
    if (!acc[programId]) {
      acc[programId] = {
        programId,
        programCode: mapping.Program?.code || '—',
        programName: mapping.Program?.name_vi || 'Chưa cập nhật',
        courses: []
      };
    }
    acc[programId].courses.push(mapping.Course);
    return acc;
  }, {});

  const formattedBlock = {
    id: block.id.toString(),
    code: block.code,
    title: block.title,
    blockType: block.block_type,
    blockTypeLabel: getBlockTypeLabel(block.block_type),
    displayOrder: block.display_order,
    programs: Object.values(programGroups)
  };

  return {
    success: true,
    data: formattedBlock
  };
}, CONTEXT);

// PATCH /api/tms/programs/blocks/[id] - Cập nhật khối học phần
export const PATCH = withBody(async (body: unknown, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const blockId = BigInt(params.id);
  const data = body as {
    code?: string;
    title?: string;
    block_type?: string;
    display_order?: number;
  };

  // Check if block exists
  const existingBlock = await db.programBlock.findUnique({
    where: { id: blockId }
  });

  if (!existingBlock) {
    throw new Error('Không tìm thấy khối học phần');
  }

  const updateData: any = {};
  
  if (data.code !== undefined) {
    updateData.code = data.code.trim();
  }
  if (data.title !== undefined) {
    updateData.title = data.title.trim();
  }
  if (data.block_type !== undefined) {
    updateData.block_type = data.block_type;
  }
  if (data.display_order !== undefined) {
    updateData.display_order = data.display_order;
  }

  const result = await db.programBlock.update({
    where: { id: blockId },
    data: updateData
  });

  return {
    success: true,
    data: {
      id: result.id.toString(),
      code: result.code,
      title: result.title,
      blockType: result.block_type,
      blockTypeLabel: getBlockTypeLabel(result.block_type),
      displayOrder: result.display_order
    }
  };
}, CONTEXT);

// DELETE /api/tms/programs/blocks/[id] - Xóa khối học phần
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const blockId = BigInt(params.id);

  // Check if block exists
  const existingBlock = await db.programBlock.findUnique({
    where: { id: blockId }
  });

  if (!existingBlock) {
    throw new Error('Không tìm thấy khối học phần');
  }

  // Check if block is used in any program course mappings
  const courseMappings = await db.programCourseMap.findMany({
    where: { block_id: blockId },
    include: {
      Program: {
        select: {
          code: true,
          name_vi: true
        }
      }
    }
  });

  if (courseMappings.length > 0) {
    const programs = courseMappings.map(m => `${m.Program?.code || ''} (${m.Program?.name_vi || ''})`).join(', ');
    throw new Error(`Không thể xóa khối học phần này vì đang được sử dụng trong các chương trình: ${programs}`);
  }

  await db.programBlock.delete({
    where: { id: blockId }
  });

  return {
    success: true,
    data: {
      id: params.id,
      message: `Đã xóa khối học phần ${existingBlock.code}`
    }
  };
}, CONTEXT);

function getBlockTypeLabel(blockType: string): string {
  const typeMap: Record<string, string> = {
    'CORE': 'Khối kiến thức chung',
    'MAJOR': 'Khối kiến thức chuyên ngành',
    'ELECTIVE': 'Khối kiến thức tự chọn',
    'FOUNDATION': 'Khối kiến thức cơ sở',
    'SUPPORT': 'Khối kiến thức bổ trợ',
    'CAPSTONE': 'Khối đồ án/luận văn',
    'INTERNSHIP': 'Khối thực tập',
  };
  return typeMap[blockType.toUpperCase()] || blockType;
}