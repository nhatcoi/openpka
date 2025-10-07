import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');

  // Build WHERE conditions
  const where: any = {
    status: 'ACTIVE',
    type: 'FACULTY' // Chỉ lấy các đơn vị có type FACULTY
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Fetch faculties
  const faculties = await db.orgUnit.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      parent_id: true,
      status: true,
      description: true
    },
    orderBy: [
      { code: 'asc' },
      { name: 'asc' }
    ],
    take: limit
  });

  // Format response for Select components
  const formattedFaculties = faculties.map(faculty => ({
    id: faculty.id.toString(),
    code: faculty.code,
    name: faculty.name,
    type: faculty.type,
    parent_id: faculty.parent_id?.toString() || null,
    status: faculty.status,
    description: faculty.description,
    label: `${faculty.code} - ${faculty.name}`,
    value: faculty.id.toString()
  }));

  return {
    items: formattedFaculties,
    total: formattedFaculties.length
  };
}, 'fetch faculties');