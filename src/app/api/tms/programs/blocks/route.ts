import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'quản lý khối học phần chương trình';

// GET /api/tms/programs/blocks - Lấy danh sách khối học phần và nhóm khối
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || 'blocks'; // 'blocks' or 'groups'
    const search = searchParams.get('search');

    if (type === 'groups') {
      // Fetch program block groups
      const whereClause: any = {};
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { group_type: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const groups = await db.programBlockGroup.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: whereClause,
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
        },
        orderBy: { display_order: 'asc' }
      });

      const total = await db.programBlockGroup.count({
        where: whereClause
      });

      // Serialize BigInt values
      const serializedGroups = JSON.parse(JSON.stringify(groups, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      return NextResponse.json({
        success: true,
        data: serializedGroups,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Fetch program blocks (default)
      const whereClause: any = {};
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { block_type: { contains: search, mode: 'insensitive' } }
        ];
      }

      const blocks = await db.programBlock.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: whereClause,
        include: {
          _count: {
            select: {
              ProgramCourseMap: true
            }
          }
        },
        orderBy: { display_order: 'asc' }
      });

      const total = await db.programBlock.count({
        where: whereClause
      });

      // Serialize BigInt values
      const serializedBlocks = JSON.parse(JSON.stringify(blocks, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      return NextResponse.json({
        success: true,
        data: serializedBlocks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  } catch (error) {
    console.error('Error in blocks API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to quản lý khối học phần chương trình',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/tms/programs/blocks - Tạo khối học phần hoặc nhóm khối mới
export const POST = withBody(async (body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const userId = BigInt(session.user.id);
  const data = body as {
    type: 'block' | 'group';
    code: string;
    title: string;
    block_type?: string;
    group_type?: string;
    display_order?: number;
    description?: string;
    parent_id?: number;
  };

  // Validate required fields
  if (!data.code || !data.title) {
    throw new Error('Thiếu mã hoặc tiêu đề');
  }

  if (data.type === 'group') {
    // Create program block group
    const group = await db.programBlockGroup.create({
      data: {
        code: data.code,
        title: data.title,
        group_type: data.group_type || 'GENERAL',
        display_order: data.display_order || 1,
        description: data.description,
        parent_id: data.parent_id ? BigInt(data.parent_id) : null,
      },
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
    const serializedGroup = JSON.parse(JSON.stringify(group, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return serializedGroup;
  } else {
    // Create program block
    const block = await db.programBlock.create({
      data: {
        code: data.code,
        title: data.title,
        block_type: data.block_type || 'GENERAL',
        display_order: data.display_order || 1,
      },
      include: {
        _count: {
          select: {
            ProgramCourseMap: true
          }
        }
      }
    });

    // Serialize BigInt values
    const serializedBlock = JSON.parse(JSON.stringify(block, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return serializedBlock;
  }
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