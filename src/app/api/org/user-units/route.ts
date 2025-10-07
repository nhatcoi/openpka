import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { getUserAccessibleUnits } from '@/lib/auth/hierarchical-permissions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';

// GET /api/org/user-units - Lấy danh sách đơn vị user có quyền truy cập
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const accessibleUnits = await getUserAccessibleUnits(session.user.id);
    
    return {
      units: accessibleUnits,
      total: accessibleUnits.length
    };
  },
  'get user accessible units'
);
