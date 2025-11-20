import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, withBody, validateSchema } from '@/lib/api/api-handler';
import { Schemas } from '@/lib/api/api-schemas';
import { Prisma } from '@prisma/client';

export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const org_unit_id = searchParams.get('org_unit_id');
    const assignment_type = searchParams.get('assignment_type');
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const referenceDateParam = searchParams.get('reference_date');
    let referenceDate = referenceDateParam ? new Date(referenceDateParam) : new Date();
    if (Number.isNaN(referenceDate.getTime())) {
      referenceDate = new Date();
    }

    // Build where clause
    const where: Prisma.OrgAssignmentWhereInput = {};
    if (employee_id && employee_id !== 'undefined') where.employee_id = BigInt(employee_id);
    if (org_unit_id && org_unit_id !== 'undefined') where.org_unit_id = BigInt(org_unit_id);
    if (assignment_type && assignment_type !== 'undefined') where.assignment_type = assignment_type;
    if (!includeInactive) {
      where.OR = [
        { end_date: null },
        { end_date: { gte: referenceDate } },
      ];
    }

    const assignments = await db.orgAssignment.findMany({
      where,
      include: {
        Employee: {
          include: {
            User: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
        OrgUnit: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        JobPosition: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    return assignments;
  },
  'fetch assignments'
);

export const POST = withBody(
  async (body: unknown) => {
    // Convert string allocation to number if needed
    const data = body as Record<string, unknown>;
    if (data.allocation && typeof data.allocation === 'string') {
      data.allocation = parseFloat(data.allocation);
    }
    
    // Validate input
    const validatedData = validateSchema(Schemas.Assignment.Create, data);
    const { employee_id, org_unit_id, job_position_id, start_date, end_date, assignment_type, is_primary, allocation } = validatedData;

    // Check if employee exists
    const employee = await db.employee.findUnique({
      where: { id: BigInt(employee_id) },
    });
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if org unit exists
    const orgUnit = await db.orgUnit.findUnique({
      where: { id: BigInt(org_unit_id) },
    });
    if (!orgUnit) {
      throw new Error('Organization unit not found');
    }

    // Check if job position exists (if provided)
    if (job_position_id) {
      const jobPosition = await db.jobPosition.findUnique({
        where: { id: BigInt(job_position_id) },
      });
      if (!jobPosition) {
        throw new Error('Job position not found');
      }
    }

    // Check for existing active assignment
    const existingAssignment = await db.orgAssignment.findFirst({
      where: {
        employee_id: BigInt(employee_id),
        org_unit_id: BigInt(org_unit_id),
        is_primary: true,
        OR: [
          { end_date: null },
          { end_date: { gte: new Date(start_date) } },
        ],
      },
    });

    if (existingAssignment) {
      throw new Error('Nhân viên này đã có phân công chính trong đơn vị này');
    }

    // Create assignment
    const assignment = await db.orgAssignment.create({
      data: {
        employee_id: BigInt(employee_id),
        org_unit_id: BigInt(org_unit_id),
        position_id: job_position_id ? BigInt(job_position_id) : null,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        assignment_type: assignment_type || 'admin',
        is_primary: is_primary !== undefined ? is_primary : true,
        allocation: allocation ? parseFloat(allocation.toString()) : 1.00,
      },
      include: {
        Employee: {
          include: {
            User: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
        OrgUnit: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        JobPosition: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    return assignment;
  },
  'create assignment'
);
