import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { createErrorResponse } from '@/lib/api/api-handler';

// GET /api/tms/program-blocks - Lấy danh sách mẫu khối học phần
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

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

    // Serialize BigInt values manually
    const serializedTemplates = JSON.parse(JSON.stringify(templates, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      data: serializedTemplates
    });
  } catch (error) {
    console.error('Error in program blocks templates API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load program block templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
