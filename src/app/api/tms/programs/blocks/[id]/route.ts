import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'quản lý khối học phần chương trình';

// GET /api/tms/programs/blocks/[id] - Lấy chi tiết khối học phần hoặc nhóm khối
export const GET = withErrorHandling(async (req: NextRequest, context?: { params?: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  if (!context?.params) throw new Error('Missing params');
  const { id } = await context.params;
  
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get('type') || 'block';
  const type = typeParam === 'groups' ? 'group' : typeParam; // Support both 'group' and 'groups'
  const blockId = BigInt(id);

  if (type === 'group') {
    // Get program block group
    const group = await db.programBlockGroup.findUnique({
      where: { id: blockId },
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            title: true
          }
        },
        children: {
          select: {
            id: true,
            code: true,
            title: true,
            group_type: true,
            display_order: true
          },
          orderBy: { display_order: 'asc' }
        },
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
        },
        _count: {
          select: {
            ProgramCourseMap: true,
            children: true
          }
        }
      }
    });

    if (!group) {
      return createErrorResponse('Not Found', 'Không tìm thấy nhóm khối học phần', 404);
    }

    return group;
  } else {
    // Get program block
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
        },
        _count: {
          select: {
            ProgramCourseMap: true
          }
        }
      }
    });

    if (!block) {
      return createErrorResponse('Not Found', 'Không tìm thấy khối học phần', 404);
    }

    return block;
  }
}, CONTEXT);

// PATCH /api/tms/programs/blocks/[id] - Cập nhật khối học phần hoặc nhóm khối
export const PATCH = withBody(async (body: unknown, request: Request, context?: { params?: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  if (!context?.params) throw new Error('Missing params');
  const { id } = await context.params;
  
  const blockId = BigInt(id);
  const data = body as {
    type: 'block' | 'group';
    code?: string;
    title?: string;
    block_type?: string;
    group_type?: string;
    display_order?: number;
    description?: string;
    parent_id?: number;
  };

  if (data.type === 'group') {
    // Update program block group
    const existingGroup = await db.programBlockGroup.findUnique({
      where: { id: blockId },
      select: { id: true, code: true, title: true }
    });

    if (!existingGroup) {
      throw new Error('Không tìm thấy nhóm khối học phần');
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code.trim();
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.group_type !== undefined) updateData.group_type = data.group_type;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id ? BigInt(data.parent_id) : null;

    const updatedGroup = await db.programBlockGroup.update({
      where: { id: blockId },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            title: true
          }
        },
        children: {
          select: {
            id: true,
            code: true,
            title: true,
            group_type: true,
            display_order: true
          },
          orderBy: { display_order: 'asc' }
        },
        _count: {
          select: {
            ProgramCourseMap: true,
            children: true
          }
        }
      }
    });

    // Serialize BigInt values
    const serializedGroup = JSON.parse(JSON.stringify(updatedGroup, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return serializedGroup;
  } else {
    // Update program block
    const existingBlock = await db.programBlock.findUnique({
      where: { id: blockId },
      select: { id: true, code: true, title: true }
    });

    if (!existingBlock) {
      throw new Error('Không tìm thấy khối học phần');
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code.trim();
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.block_type !== undefined) updateData.block_type = data.block_type;
    if (data.display_order !== undefined) updateData.display_order = data.display_order;

    const updatedBlock = await db.programBlock.update({
      where: { id: blockId },
      data: updateData,
      include: {
        _count: {
          select: {
            ProgramCourseMap: true
          }
        }
      }
    });

    // Serialize BigInt values
    const serializedBlock = JSON.parse(JSON.stringify(updatedBlock, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return serializedBlock;
  }
}, CONTEXT);

// DELETE /api/tms/programs/blocks/[id] - Xóa khối học phần hoặc nhóm khối
export const DELETE = withErrorHandling(async (req: NextRequest, context?: { params?: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  if (!context?.params) throw new Error('Missing params');
  const { id } = await context.params;
  
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get('type') || 'block';
  const type = typeParam === 'groups' ? 'group' : typeParam; // Support both 'group' and 'groups'
  const blockId = BigInt(id);

  if (type === 'group') {
    // Delete program block group
    const existingGroup = await db.programBlockGroup.findUnique({
      where: { id: blockId },
      include: {
        children: {
          select: { id: true, code: true, title: true }
        },
        ProgramCourseMap: {
          include: {
            Program: {
              select: {
                code: true,
                name_vi: true
              }
            }
          }
        }
      }
    });

    if (!existingGroup) {
      throw new Error('Không tìm thấy nhóm khối học phần');
    }

    // Check if group has children
    if (existingGroup.children.length > 0) {
      throw new Error('Không thể xóa nhóm khối học phần này vì còn có nhóm con');
    }

    // Check if group is used in any program course mappings
    if (existingGroup.ProgramCourseMap.length > 0) {
      const programs = existingGroup.ProgramCourseMap.map(m => 
        `${m.Program?.code || ''} (${m.Program?.name_vi || ''})`
      ).join(', ');
      throw new Error(`Không thể xóa nhóm khối học phần này vì đang được sử dụng trong các chương trình: ${programs}`);
    }

    await db.programBlockGroup.delete({
      where: { id: blockId }
    });

    return {
      success: true,
      data: {
        id: id,
        message: `Đã xóa nhóm khối học phần ${existingGroup.code}`
      }
    };
  } else {
    // Delete program block
    const existingBlock = await db.programBlock.findUnique({
      where: { id: blockId },
      include: {
        ProgramCourseMap: {
          include: {
            Program: {
              select: {
                code: true,
                name_vi: true
              }
            }
          }
        }
      }
    });

    if (!existingBlock) {
      throw new Error('Không tìm thấy khối học phần');
    }

    // Check if block is used in any program course mappings
    if (existingBlock.ProgramCourseMap.length > 0) {
      const programs = existingBlock.ProgramCourseMap.map(m => 
        `${m.Program?.code || ''} (${m.Program?.name_vi || ''})`
      ).join(', ');
      throw new Error(`Không thể xóa khối học phần này vì đang được sử dụng trong các chương trình: ${programs}`);
    }

    await db.programBlock.delete({
      where: { id: blockId }
    });

    return {
      success: true,
      data: {
        id: id,
        message: `Đã xóa khối học phần ${existingBlock.code}`
      }
    };
  }
}, CONTEXT);