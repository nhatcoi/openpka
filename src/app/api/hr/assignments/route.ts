import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';

// Helper function to serialize BigInt to string
const serializeAssignment = (assignment: { id: bigint; [key: string]: unknown }) => {
    if (!assignment) return null;
    return {
        ...assignment,
        id: assignment.id.toString(),
        employee_id: assignment.employee_id?.toString() || null,
        org_unit_id: assignment.org_unit_id?.toString() || null,
        position_id: assignment.position_id?.toString() || null,
        allocation: assignment.allocation.toString(),
    };
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            requirePermission(session, 'hr.assignment.view');
        }
        
        const assignments = await db.OrgAssignment.findMany({
            include: {
                Employee: {
                    include: {
                        User: true,
                    },
                },
                OrgUnit: true,
            },
        });

        // Convert BigInt to string for JSON serialization
        const serializedAssignments = assignments.map((assignment: { id: bigint; [key: string]: unknown }) => ({
            ...serializeAssignment(assignment),
            Employee: assignment.Employee ? {
                ...assignment.Employee,
                id: assignment.Employee.id.toString(),
                user_id: assignment.Employee.user_id?.toString() || null,
                User: assignment.Employee.User ? {
                    ...assignment.Employee.User,
                    id: assignment.Employee.User.id.toString()
                } : null
            } : null,
            OrgUnit: assignment.OrgUnit ? {
                ...assignment.OrgUnit,
                id: assignment.OrgUnit.id.toString(),
                parent_id: assignment.OrgUnit.parent_id?.toString() || null,
            } : null
        }));

        // Use JSON.stringify with replacer to handle BigInt
        const jsonString = JSON.stringify({ success: true, data: serializedAssignments }, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );
        return NextResponse.json(JSON.parse(jsonString));
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Check permission
        requirePermission(session, 'hr.assignment.create');
        
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

        // Validate required fields
        if (!employee_id || !org_unit_id || !start_date) {
            return NextResponse.json(
                { success: false, error: 'employee_id, org_unit_id, and start_date are required' },
                { status: 400 }
            );
        }

        const assignment = await db.OrgAssignment.create({
            data: {
                employee_id: BigInt(employee_id),
                org_unit_id: BigInt(org_unit_id),
                position_id: position_id ? BigInt(position_id) : null,
                is_primary: is_primary ?? true,
                assignment_type: assignment_type || 'admin',
                allocation: allocation ? parseFloat(allocation) : 1.00,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : null,
            },
        });

        return NextResponse.json({ success: true, data: serializeAssignment(assignment) });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create assignment'
            },
            { status: 500 }
        );
    }
}
