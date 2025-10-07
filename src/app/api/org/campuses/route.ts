import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';
import { Prisma } from '@prisma/client';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Build where clause
    const where: Prisma.CampusWhereInput = {};
    
    if (search) {
      where.OR = [
        { name_vi: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get campuses from database
    const campuses = await db.campus.findMany({
      where,
      select: {
        id: true,
        code: true,
        name_vi: true,
        name_en: true,
        address: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        name_vi: 'asc'
      },
    });

    return campuses;
  },
  'fetch campuses'
);
