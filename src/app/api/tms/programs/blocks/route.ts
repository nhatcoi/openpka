import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withBody, withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'quản lý khối học phần chương trình';

// GET /api/tms/programs/blocks - Lấy danh sách khối học phần
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const programId = searchParams.get('programId');
  const search = searchParams.get('search');
  const templatesMode = searchParams.get('templates') === 'true';

  if (templatesMode) {
    // Fetch program block templates from program_blocks table
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { block_type: { contains: search, mode: 'insensitive' } }
      ];
    }

    const templates = await db.programBlock.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: whereClause,
      orderBy: { display_order: 'asc' }
    });

    const total = await db.programBlock.count({
      where: whereClause
    });

    return {
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Fetch program block assignments using program_course_map
  const whereClause: any = {
    block_id: { not: null } // Only get courses assigned to blocks
  };
  
  if (programId && programId !== 'all') {
    whereClause.program_id = BigInt(programId);
  }

  if (search) {
    whereClause.OR = [
      {
        ProgramBlock: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } }
          ]
        }
      },
      {
        Program: {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name_vi: { contains: search, mode: 'insensitive' } }
          ]
        }
      },
      {
        Course: {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { name_vi: { contains: search, mode: 'insensitive' } }
          ]
        }
      }
    ];
  }

  // Get program course mappings that have block_id
  const courseMappings = await db.programCourseMap.findMany({
    take: limit,
    skip: (page - 1) * limit,
    where: whereClause,
    include: {
      Program: {
        select: {
          id: true,
          code: true,
          name_vi: true
        }
      },
      ProgramBlock: {
        select: {
          id: true,
          code: true,
          title: true,
          block_type: true,
          display_order: true
        }
      },
      Course: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          credits: true
        }
      }
    },
    orderBy: [
      { ProgramBlock: { display_order: 'asc' } },
      { display_order: 'asc' }
    ]
  });

  // Get total count
  const total = await db.programCourseMap.count({
    where: whereClause
  });

  // Group by block and program for better organization
  const groupedBlocks = courseMappings.reduce((acc: any, item: any) => {
    const key = `${item.program_id}-${item.block_id}`;
    if (!acc[key]) {
      acc[key] = {
        id: item.block_id?.toString(),
        programId: item.program_id?.toString(),
        programCode: item.Program?.code || '—',
        programName: item.Program?.name_vi || 'Chưa cập nhật',
        templateId: item.block_id?.toString(),
        templateCode: item.ProgramBlock?.code || '—',
        templateTitle: item.ProgramBlock?.title || 'Chưa cập nhật',
        blockType: item.ProgramBlock?.block_type || 'unknown',
        blockTypeLabel: getBlockTypeLabel(item.ProgramBlock?.block_type || 'unknown'),
        displayOrder: item.ProgramBlock?.display_order || 1,
        isRequired: Boolean(item.is_required),
        isActive: true, // Default to true since we're showing active assignments
        customTitle: null,
        customDescription: null,
        assignedAt: new Date().toISOString(),
        courses: []
      };
    }
    acc[key].courses.push(item.Course);
    return acc;
  }, {});

  const formattedBlocks = Object.values(groupedBlocks);

  return {
    success: true,
    data: formattedBlocks,
    pagination: {
      page,
      limit,
      total: formattedBlocks.length,
      totalPages: Math.ceil(formattedBlocks.length / limit),
    },
  };
}, CONTEXT);

// POST /api/tms/programs/blocks - Tạo khối học phần mới
export const POST = withBody(async (body: unknown) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const userId = BigInt(session.user.id);
  const data = body as {
    program_id: number;
    template_id: number;
    display_order?: number;
    is_required?: boolean;
    is_active?: boolean;
    custom_title?: string;
    custom_description?: string;
  };

  // Validate required fields
  if (!data.program_id || !data.template_id) {
    throw new Error('Thiếu program_id hoặc template_id');
  }

  const programId = BigInt(data.program_id);
  const templateId = BigInt(data.template_id);

  // Check if program exists
  const program = await db.program.findUnique({
    where: { id: programId },
    select: { id: true, code: true, name_vi: true }
  });
  if (!program) {
    throw new Error('Không tìm thấy chương trình đào tạo');
  }

  // Check if template exists
  const template = await db.programBlock.findUnique({
    where: { id: templateId },
    select: { id: true, code: true, title: true, block_type: true }
  });
  if (!template) {
    throw new Error('Không tìm thấy template khối học phần');
  }

  // For this schema, we don't create assignments directly
  // Instead, we would create course mappings with block_id
  // This is a simplified response for now
  return {
    success: true,
    data: {
      id: template.id.toString(),
      programCode: program.code || '—',
      programName: program.name_vi || 'Chưa cập nhật',
      templateCode: template.code || '—',
      templateTitle: template.title || 'Chưa cập nhật',
      blockType: template.block_type || 'unknown',
      displayOrder: data.display_order || 1,
      isRequired: data.is_required ?? true,
      isActive: data.is_active ?? true,
      customTitle: data.custom_title,
      customDescription: data.custom_description,
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