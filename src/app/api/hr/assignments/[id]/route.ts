import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/auth/api-permissions';

const serializeAssignment = (assignment: any) => {
  if (!assignment) return null;
  return {
    ...assignment,
    id: assignment.id?.toString(),
    employee_id: assignment.employee_id?.toString() || null,
    org_unit_id: assignment.org_unit_id?.toString() || null,
    position_id: assignment.position_id?.toString() || null,
    allocation: assignment.allocation ? assignment.allocation.toString() : null,
    Employee: assignment.Employee
      ? {
          ...assignment.Employee,
          id: assignment.Employee.id?.toString(),
          user_id: assignment.Employee.user_id?.toString() || null,
          User: assignment.Employee.User
            ? {
                ...assignment.Employee.User,
                id: assignment.Employee.User.id?.toString(),
              }
            : null,
        }
      : null,
    OrgUnit: assignment.OrgUnit
      ? {
          ...assignment.OrgUnit,
          id: assignment.OrgUnit.id?.toString(),
          parent_id: assignment.OrgUnit.parent_id?.toString() || null,
        }
      : null,
    JobPosition: assignment.JobPosition
      ? {
          ...assignment.JobPosition,
          id: assignment.JobPosition.id?.toString(),
        }
      : null,
  };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session, 'hr.assignment.view');

    const { id } = await params;
    const assignmentId = BigInt(id);

    const assignment = await db.OrgAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        Employee: {
          include: {
            User: true,
          },
        },
        OrgUnit: true,
        JobPosition: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeAssignment(assignment) });
  } catch (error) {
    console.error('Error fetching assignment by id:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session, 'hr.assignment.update');

    const { id } = await params;
    const assignmentId = BigInt(id);
    const body = await request.json();

    const {
      employee_id,
      org_unit_id,
      position_id,
      is_primary,
      assignment_type,
      allocation,
      start_date,
      end_date,
    } = body;

    const updatedAssignment = await db.OrgAssignment.update({
      where: { id: assignmentId },
      data: {
        employee_id: employee_id ? BigInt(employee_id) : undefined,
        org_unit_id: org_unit_id ? BigInt(org_unit_id) : undefined,
        position_id: position_id ? BigInt(position_id) : null,
        is_primary: typeof is_primary === 'boolean' ? is_primary : undefined,
        assignment_type: assignment_type || undefined,
        allocation: allocation !== undefined ? Number(allocation) : undefined,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : null,
      },
      include: {
        Employee: {
          include: {
            User: true,
          },
        },
        OrgUnit: true,
        JobPosition: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: serializeAssignment(updatedAssignment),
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session, 'hr.assignment.delete');

    const { id } = await params;
    const assignmentId = BigInt(id);

    await db.OrgAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}

