import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { getToken } from 'next-auth/jwt';

export async function GET() {
  try {
    // Get current user session and permissions
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ? BigInt(session.user.id) : null;
    const userPermissions = session?.user?.permissions || [];

    // Check if user has admin permissions (can see all employees)
    // Rector should see all employees, Dean/Manager should see employees in their org
    const isRector = userPermissions.includes('employee.delete'); // Only rector has delete permission
    const isDeanOrManager = userPermissions.includes('employee.update') && !userPermissions.includes('employee.delete');
    const isAdmin = isRector || (userPermissions.includes('hr.employees.view') &&
      (userPermissions.includes('hr.employees.create') ||
        userPermissions.includes('hr.employees.update') ||
        userPermissions.includes('hr.employees.delete')));

    let whereClause = {};

    if (isRector) {
      // Rector can see all employees - no filtering needed
      whereClause = {};
    } else if (isDeanOrManager && currentUserId) {
      // Dean/Manager should see employees in their organizational scope
      const currentUserEmployee = await db.employee.findFirst({
        where: { user_id: currentUserId },
        include: {
          OrgAssignment: {
            include: {
              OrgUnit: true
            }
          }
        }
      });

      if (currentUserEmployee && currentUserEmployee.assignments.length > 0) {
        // Get all org units that current user manages (including sub-units)
        const userOrgUnitIds = currentUserEmployee.assignments.map(a => a.org_unit_id);

        // Find all sub-units of user's org units
        const subOrgUnits = await db.OrgUnit.findMany({
          where: {
            parent_id: { in: userOrgUnitIds }
          }
        });

        const allOrgUnitIds = [
          ...userOrgUnitIds,
          ...subOrgUnits.map(unit => unit.id)
        ];

        // Filter employees to only those in user's organizational scope
        whereClause = {
          OrgAssignment: {
            some: {
              org_unit_id: { in: allOrgUnitIds }
            }
          }
        };
      } else {
        // If Dean/Manager has no org assignments, they can only see themselves
        whereClause = { user_id: currentUserId };
      }
    } else if (!isAdmin && currentUserId) {
      // Regular users can only see themselves
      whereClause = { user_id: currentUserId };
    }

    const employees = await db.employee.findMany({
      where: whereClause,
      include: {
        User: true,
        OrgAssignment: {
          include: {
            OrgUnit: true,
            JobPosition: true
          }
        }
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedEmployees = employees.map((employee: { id: bigint; [key: string]: unknown }) => ({
      ...employee,
      id: employee.id.toString(),
      user_id: employee.user_id?.toString() || null,
      created_at: employee.created_at?.toString() || null,
      updated_at: employee.updated_at?.toString() || null,
      User: employee.User ? {
        ...employee.User,
        id: employee.User.id.toString(),
        created_at: employee.User.created_at?.toString() || null,
        updated_at: employee.User.updated_at?.toString() || null
      } : null,
      OrgAssignment: employee.OrgAssignment?.map((assignment: { id: bigint; [key: string]: unknown }) => ({
        ...assignment,
        id: assignment.id.toString(),
        employee_id: assignment.employee_id?.toString() || null,
        org_unit_id: assignment.org_unit_id?.toString() || null,
        position_id: assignment.position_id?.toString() || null,
        allocation: assignment.allocation?.toString() || null,
        created_at: assignment.created_at?.toString() || null,
        updated_at: assignment.updated_at?.toString() || null,
        OrgUnit: assignment.OrgUnit ? {
          ...assignment.OrgUnit,
          id: assignment.OrgUnit.id.toString()
        } : null,
        JobPosition: assignment.job_positions ? {
          ...assignment.job_positions,
          id: assignment.job_positions.id.toString()
        } : null
      })) || []
    }));

    // Use JSON.stringify with replacer to handle BigInt
    const jsonString = JSON.stringify({ success: true, data: serializedEmployees }, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    return new Response(jsonString, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      employee_no,
      employment_type,
      status,
      hired_at,
    } = body;

    // Get current user from session
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ? BigInt(session.user.id) : undefined;

    const employee = await db.employee.create({
      data: {
        User: user_id ? { connect: { id: BigInt(user_id) } } : undefined,
        employee_no,
        employment_type,
        status,
        hired_at: hired_at ? new Date(hired_at) : null,
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedEmployee = {
      ...employee,
      id: employee.id.toString(),
      user_id: employee.User_id?.toString() || null,
    };

    // Log the creation activity
    const actorInfo = getActorInfo(request);
    await logEmployeeActivity({
      employee_id: employee.id,
      action: 'CREATE',
      entity_type: 'employees',
      entity_id: employee.id,
      new_value: JSON.stringify(serializedEmployee),
      actor_id: currentUserId,
      ...actorInfo,
    });

    return NextResponse.json({ success: true, data: serializedEmployee });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create employee'
      },
      { status: 500 }
    );
  }
}
