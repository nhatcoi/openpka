import { db } from '@/lib/db';
import { withIdParam, withIdAndBody, validateSchema } from '@/lib/api/api-handler';
import { Schemas } from '@/lib/api/api-schemas';

export const GET = withIdParam(
  async (id: string) => {
    const assignment = await db.orgAssignment.findUnique({
      where: { id: BigInt(id) },
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

    if (!assignment) {
      throw new Error('Không tìm thấy phân công');
    }

    return assignment;
  },
  'fetch assignment'
);

export const PUT = withIdAndBody(
  async (id: string, body: unknown) => {
    // Convert string allocation to number if needed
    const data = body as Record<string, unknown>;
    if (data.allocation && typeof data.allocation === 'string') {
      data.allocation = parseFloat(data.allocation);
    }
    
    const validatedData = validateSchema(Schemas.Assignment.Update, data);
    const { employee_id, org_unit_id, job_position_id, start_date, end_date, assignment_type, is_primary, allocation } = validatedData;


    const existingAssignment = await db.orgAssignment.findUnique({
      where: { id: BigInt(id) },
    });
    if (!existingAssignment) {
      throw new Error('Assignment not found');
    }

    if (employee_id) {
      const employee = await db.employee.findUnique({
        where: { id: BigInt(employee_id) },
      });
      if (!employee) {
        throw new Error('Employee not found');
      }
    }

    if (org_unit_id) {
      const orgUnit = await db.orgUnit.findUnique({
        where: { id: BigInt(org_unit_id) },
      });
      if (!orgUnit) {
        throw new Error('Organization unit not found');
      }
    }

    if (job_position_id) {
      const jobPosition = await db.jobPosition.findUnique({
        where: { id: BigInt(job_position_id) },
      });
      if (!jobPosition) {
        throw new Error('Job position not found');
      }
    }

    if (employee_id || org_unit_id) {
      const checkEmployeeId = employee_id ? BigInt(employee_id) : existingAssignment.employee_id;
      const checkOrgUnitId = org_unit_id ? BigInt(org_unit_id) : existingAssignment.org_unit_id;

      const conflictingAssignment = await db.orgAssignment.findFirst({
        where: {
          id: { not: BigInt(id) },
          employee_id: checkEmployeeId,
          org_unit_id: checkOrgUnitId,
          is_primary: true,
          OR: [
            { end_date: null },
            { end_date: { gte: new Date(start_date || existingAssignment.start_date) } },
          ],
        },
      });

      if (conflictingAssignment) {
        throw new Error('Nhân viên này đã có phân công chính trong đơn vị này');
      }
    }

    // Update assignment
    const updatedAssignment = await db.orgAssignment.update({
      where: { id: BigInt(id) },
      data: {
        ...(employee_id && { employee_id: BigInt(employee_id) }),
        ...(org_unit_id && { org_unit_id: BigInt(org_unit_id) }),
        ...(job_position_id && { position_id: BigInt(job_position_id) }),
        ...(start_date && { start_date: new Date(start_date) }),
        ...(end_date && { end_date: new Date(end_date) }),
        ...(assignment_type && { assignment_type }),
        ...(is_primary !== undefined && { is_primary }),
        ...(allocation && { allocation: parseFloat(allocation.toString()) }),
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

    return updatedAssignment;
  },
  'update assignment'
);

export const DELETE = withIdParam(
  async (id: string) => {
    const assignmentId = BigInt(id);

    const assignment = await db.orgAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    await db.orgAssignment.delete({
      where: { id: assignmentId },
    });

    return { success: true };
  },
  'delete assignment'
);