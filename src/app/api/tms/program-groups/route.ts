import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { withErrorHandling, createErrorResponse } from '@/lib/api/api-handler';

const CONTEXT = 'lấy danh sách nhóm khối học phần (ProgramBlockGroup)';

// GET /api/tms/program-groups
export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return createErrorResponse('Unauthorized', 'Authentication required', 401);
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.max(parseInt(searchParams.get('limit') || '100', 10), 1);
  const search = searchParams.get('search') || undefined;
  const groupType = searchParams.get('groupType') || undefined;

  const where: any = {};
  if (groupType) where.group_type = groupType;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, groups] = await Promise.all([
    db.programBlockGroup.count({ where }),
    db.programBlockGroup.findMany({
      where,
      select: { id: true, code: true, title: true, group_type: true, display_order: true, parent_id: true },
      orderBy: [ { display_order: 'asc' }, { code: 'asc' } ],
      skip,
      take: limit,
    }),
  ]);

  const items = groups.map((g) => ({
    id: g.id.toString(),
    code: g.code,
    title: g.title,
    group_type: g.group_type,
    display_order: g.display_order ?? 1,
    parent_id: g.parent_id != null ? g.parent_id.toString() : null,
    label: `${g.code} — ${g.title}`,
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
}, CONTEXT);


