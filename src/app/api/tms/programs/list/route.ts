import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';
import { ProgramStatus } from '@/constants/programs';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const limit = Math.max(parseInt(searchParams.get('limit') || '50', 10), 1);

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name_vi: { contains: search, mode: 'insensitive' } },
      { name_en: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const programs = await db.program.findMany({
    where,
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      version: true,
      total_credits: true,
      status: true,
      org_unit_id: true,
    },
    orderBy: [
      { code: 'asc' },
      { name_vi: 'asc' },
    ],
    take: limit,
  });

  const items = programs.map((program) => ({
    id: program.id.toString(),
    code: program.code,
    name_vi: program.name_vi,
    name_en: program.name_en || '',
    label: `${program.code ?? 'N/A'} - ${program.name_vi ?? program.name_en ?? ''}`.trim(),
    value: program.id.toString(),
    total_credits: program.total_credits,
    version: program.version,
    status: (program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
    org_unit_id: program.org_unit_id?.toString() ?? null,
  }));

  return {
    items,
    total: items.length,
  };
}, 'fetch programs list');
