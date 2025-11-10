import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test creating a sample academic history entry
    const testEntry = await db.academic_history.create({
      data: {
        entity_type: 'test',
        entity_id: BigInt(1),
        action: 'create',
        field_name: 'test_field',
        old_value: null,
        new_value: 'test_value',
        change_summary: 'Test entry created',
        actor_id: BigInt(1),
        actor_name: 'Test User',
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        request_id: 'test-request-123',
        metadata: { test: true },
      },
    });

    // Test reading the entry
    const entries = await db.academic_history.findMany({
      where: { entity_type: 'test' },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      message: 'Academic history API test successful',
      data: {
        created: testEntry,
        recent_entries: entries,
      },
    });
  } catch (error) {
    console.error('Error testing academic history API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test academic history API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
