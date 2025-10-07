import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');

  // Build WHERE conditions
  const where: any = {};

  if (search) {
    where.OR = [
      { name_vi: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Fetch courses for autocomplete/dropdown
  const courses = await db.course.findMany({
    where,
    select: {
      id: true,
      code: true,
      name_vi: true,
      name_en: true,
      credits: true,
      type: true,
      org_unit_id: true
    },
    orderBy: [
      { code: 'asc' },
      { name_vi: 'asc' }
    ],
    take: limit
  });

  // Format response for Select components
  const formattedCourses = courses.map(course => ({
    id: course.id.toString(),
    code: course.code,
    name_vi: course.name_vi,
    name_en: course.name_en || '',
    credits: parseFloat(course.credits.toString()),
    type: course.type,
    org_unit_id: course.org_unit_id.toString(),
    label: `${course.code} - ${course.name_vi}`,
    value: course.id.toString()
  }));

  return {
    items: formattedCourses,
    total: formattedCourses.length
  };
}, 'fetch courses list');


