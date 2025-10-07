import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { orgConfigCache } from '@/lib/org-config-cache';

// GET /api/org/types/cached - Get cached organization unit types
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force_refresh') === 'true';
    
    const types = await orgConfigCache.getTypes(forceRefresh);

    const result = {
      items: types,
      total: types.length,
      cached: !forceRefresh,
      timestamp: new Date().toISOString()
    };

    return result;
  },
  'fetch cached org unit types'
);
