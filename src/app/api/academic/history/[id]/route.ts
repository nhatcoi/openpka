import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id);

    const historyEntry = await db.academic_history.findUnique({
      where: { id },
    });

    if (!historyEntry) {
      return NextResponse.json(
        { success: false, error: 'Academic history entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: historyEntry,
    });
  } catch (error) {
    console.error('Error fetching academic history entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academic history entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id);
    const body = await request.json();
    const {
      entity_type,
      entity_id,
      action,
      field_name,
      old_value,
      new_value,
      change_summary,
      actor_id,
      actor_name,
      ip_address,
      user_agent,
      request_id,
      metadata,
    } = body;

    // Check if entry exists
    const existingEntry = await db.academic_history.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Academic history entry not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!entity_type || !entity_id || !action) {
      return NextResponse.json(
        { success: false, error: 'entity_type, entity_id, and action are required' },
        { status: 400 }
      );
    }

    const updatedEntry = await db.academic_history.update({
      where: { id },
      data: {
        entity_type,
        entity_id: BigInt(entity_id),
        action,
        field_name,
        old_value,
        new_value,
        change_summary,
        actor_id: actor_id ? BigInt(actor_id) : null,
        actor_name,
        ip_address,
        user_agent,
        request_id,
        metadata,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEntry,
    });
  } catch (error) {
    console.error('Error updating academic history entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update academic history entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = BigInt(params.id);

    // Check if entry exists
    const existingEntry = await db.academic_history.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Academic history entry not found' },
        { status: 404 }
      );
    }

    await db.academic_history.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Academic history entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting academic history entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete academic history entry' },
      { status: 500 }
    );
  }
}
