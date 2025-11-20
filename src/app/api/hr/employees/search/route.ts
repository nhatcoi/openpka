import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api/api-handler';
// import { hasPermission, hasAnyPermission } from '@/lib/permission-utils';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // For now, return all employees (authentication will be added later)
    let whereClause = {};

    // Add search condition if query is provided
    if (searchQuery.trim()) {
      whereClause = {
        ...whereClause,
        User: {
          OR: [
            { full_name: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      };
    }
    
    const employees = await db.employee.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true
          }
        }
      },
      take: limit,
      orderBy: {
        User: {
          full_name: 'asc'
        }
      }
    });

    return employees;
  },
  'search employees'
);
