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

  const block = await (db as any).programBlockAssignment.findUnique({
    where: { id: blockId },
    include: {
      Program: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          name_en: true,
        }
      },
      template: {
        select: {
          id: true,
          code: true,
          title: true,
          title_en: true,
          block_type: true,
          description: true,
        }
      }
    }
  });

  if (!block) {
    return createErrorResponse('Not Found', 'Không tìm thấy khối học phần', 404);
  }

  const formattedBlock = {
    id: block.id.toString(),
    programId: block.program_id.toString(),
    programCode: block.Program?.code || '—',
    programName: block.Program?.name_vi || 'Chưa cập nhật',
    templateId: block.template_id.toString(),
    templateCode: block.template?.code || '—',
    templateTitle: block.template?.title || 'Chưa cập nhật',
    blockType: block.template?.block_type || 'unknown',
    blockTypeLabel: getBlockTypeLabel(block.template?.block_type || 'unknown'),
    displayOrder: block.display_order,
    isRequired: block.is_required,
    isActive: block.is_active,
    customTitle: block.custom_title,
    customDescription: block.custom_description,
    assignedAt: block.assigned_at.toISOString(),
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

  const userId = BigInt(session.user.id);
  const blockId = BigInt(params.id);
  const data = body as {
    display_order?: number;
    is_required?: boolean;
    is_active?: boolean;
    custom_title?: string;
    custom_description?: string;
  };

  // Check if block exists
  const existingBlock = await (db as any).programBlockAssignment.findUnique({
    where: { id: blockId },
    include: {
      Program: {
        select: {
          id: true,
          code: true,
          name_vi: true,
        }
      },
      template: {
        select: {
          id: true,
          code: true,
          title: true,
          block_type: true,
        }
      }
    }
  });

  if (!existingBlock) {
    throw new Error('Không tìm thấy khối học phần');
  }

  const updateData: any = {};
  
  if (data.display_order !== undefined) {
    updateData.display_order = data.display_order;
  }
  if (data.is_required !== undefined) {
    updateData.is_required = data.is_required;
  }
  if (data.is_active !== undefined) {
    updateData.is_active = data.is_active;
  }
  if (data.custom_title !== undefined) {
    updateData.custom_title = data.custom_title?.trim() || null;
  }
  if (data.custom_description !== undefined) {
    updateData.custom_description = data.custom_description?.trim() || null;
  }

  updateData.updated_at = new Date();
  updateData.updated_by = userId;

  const result = await (db as any).programBlockAssignment.update({
    where: { id: blockId },
    data: updateData,
    include: {
      Program: {
        select: {
          id: true,
          code: true,
          name_vi: true,
        }
      },
      template: {
        select: {
          id: true,
          code: true,
          title: true,
          block_type: true,
        }
      }
    }
  });

  return {
    success: true,
    data: {
      id: result.id.toString(),
      programCode: result.Program?.code || '—',
      programName: result.Program?.name_vi || 'Chưa cập nhật',
      templateCode: result.template?.code || '—',
      templateTitle: result.template?.title || 'Chưa cập nhật',
      blockType: result.template?.block_type || 'unknown',
      blockTypeLabel: getBlockTypeLabel(result.template?.block_type || 'unknown'),
      displayOrder: result.display_order,
      isRequired: result.is_required,
      isActive: result.is_active,
      customTitle: result.custom_title,
      customDescription: result.custom_description,
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
  const existingBlock = await (db as any).programBlockAssignment.findUnique({
    where: { id: blockId },
    include: {
      Program: {
        select: {
          code: true,
          name_vi: true,
        }
      },
      template: {
        select: {
          code: true,
          title: true,
        }
      }
    }
  });

  if (!existingBlock) {
    throw new Error('Không tìm thấy khối học phần');
  }

  await (db as any).programBlockAssignment.delete({
    where: { id: blockId }
  });

  return {
    success: true,
    data: {
      id: params.id,
      message: `Đã xóa khối học phần ${existingBlock.template?.code || ''} khỏi chương trình ${existingBlock.Program?.code || ''}`
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
