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

  const whereClause: any = {};
  
  if (programId && programId !== 'all') {
    whereClause.program_id = BigInt(programId);
  }

  // Build search conditions
  if (search) {
    whereClause.OR = [
      {
        Program: {
          code: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        Program: {
          name_vi: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        template: {
          code: {
            contains: search,
            mode: 'insensitive'
          }
        }
      },
      {
        template: {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  if (templatesMode) {
    // Return template list using raw SQL to avoid Prisma model mismatch
    const where: string[] = [];
    const values: any[] = [];
    if (search) {
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      where.push('(t.code ILIKE $' + (values.length - 1) + ' OR t.title ILIKE $' + values.length + ')');
    }
    values.push(limit);
    values.push((page - 1) * limit);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await (db as any).$queryRawUnsafe(
      `SELECT t.id, t.code, t.title, t.title_en, t.block_type, t.is_active
       FROM academic.program_block_template t
       ${whereSql}
       ORDER BY t.code ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      ...values,
    );
    const countRows = await (db as any).$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count
       FROM academic.program_block_template t
       ${whereSql}`,
      ...(where.length ? values.slice(0, values.length - 2) : []),
    );
    const total = (Array.isArray(countRows) && countRows[0]?.count) || 0;
    return {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Assignments mode: join assignment + program + template via raw SQL
  const conditions: string[] = [];
  const params: any[] = [];
  if (programId && programId !== 'all') {
    params.push(BigInt(programId));
    conditions.push(`a.program_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    params.push(`%${search}%`);
    conditions.push(`(p.code ILIKE $${params.length - 3} OR p.name_vi ILIKE $${params.length - 2} OR t.code ILIKE $${params.length - 1} OR t.title ILIKE $${params.length})`);
  }
  const whereSql2 = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  params.push((page - 1) * limit);

  const rows = await (db as any).$queryRawUnsafe(
    `SELECT a.id, a.program_id, a.template_id, a.display_order, a.is_required, a.is_active,
            a.custom_title, a.custom_description, a.assigned_at,
            p.code AS program_code, p.name_vi AS program_name_vi,
            t.code AS template_code, t.title AS template_title, t.block_type
     FROM academic.program_block_assignment a
     LEFT JOIN academic.program p ON p.id = a.program_id
     LEFT JOIN academic.program_block_template t ON t.id = a.template_id
     ${whereSql2}
     ORDER BY p.code ASC NULLS LAST, a.display_order ASC NULLS LAST, a.id ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    ...params,
  );

  const countRows = await (db as any).$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count
     FROM academic.program_block_assignment a
     LEFT JOIN academic.program p ON p.id = a.program_id
     LEFT JOIN academic.program_block_template t ON t.id = a.template_id
     ${whereSql2}`,
    ...params.slice(0, params.length - 2),
  );
  const total = (Array.isArray(countRows) && countRows[0]?.count) || 0;

  const formatted = (rows as any[]).map((r) => ({
    id: r.id?.toString(),
    programId: r.program_id?.toString(),
    programCode: r.program_code || '—',
    programName: r.program_name_vi || 'Chưa cập nhật',
    templateId: r.template_id?.toString(),
    templateCode: r.template_code || '—',
    templateTitle: r.template_title || 'Chưa cập nhật',
    blockType: r.block_type || 'unknown',
    blockTypeLabel: getBlockTypeLabel(r.block_type || 'unknown'),
    displayOrder: r.display_order ?? null,
    isRequired: Boolean(r.is_required),
    isActive: Boolean(r.is_active),
    customTitle: r.custom_title || null,
    customDescription: r.custom_description || null,
    assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : null,
  }));

  return {
    success: true,
    data: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
    select: { id: true, code: true }
  });
  if (!program) {
    throw new Error('Không tìm thấy chương trình đào tạo');
  }

  // Check if template exists
  const template = await (db as any).programBlockTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, code: true }
  });
  if (!template) {
    throw new Error('Không tìm thấy template khối học phần');
  }

  // Check if assignment already exists
  const existingAssignment = await (db as any).programBlockAssignment.findFirst({
    where: {
      program_id: programId,
      template_id: templateId
    }
  });
  if (existingAssignment) {
    throw new Error('Khối học phần này đã được gán cho chương trình');
  }

  const result = await (db as any).programBlockAssignment.create({
    data: {
      program_id: programId,
      template_id: templateId,
      display_order: data.display_order || 1,
      is_required: data.is_required ?? true,
      is_active: data.is_active ?? true,
      custom_title: data.custom_title?.trim() || null,
      custom_description: data.custom_description?.trim() || null,
      assigned_at: new Date(),
      assigned_by: userId,
    },
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
      displayOrder: result.display_order,
      isRequired: result.is_required,
      isActive: result.is_active,
      customTitle: result.custom_title,
      customDescription: result.custom_description,
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
