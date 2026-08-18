import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export class EmployeeService {
  /**
   * Determine organizational scope filtering based on user role and permissions.
   */
  static async getScopedWhereClause(
    userId: bigint | null,
    userPermissions: string[] = []
  ): Promise<Prisma.EmployeeWhereInput> {
    const isRector = userPermissions.includes('hr.employee.delete');
    const isDeanOrManager =
      userPermissions.includes('hr.employee.update') && !userPermissions.includes('hr.employee.delete');
    const isAdmin =
      isRector ||
      (userPermissions.includes('hr.employee.view') &&
        (userPermissions.includes('hr.employee.create') ||
          userPermissions.includes('hr.employee.update') ||
          userPermissions.includes('hr.employee.delete')));

    if (isRector) {
      return {};
    }

    if (isDeanOrManager && userId) {
      const currentUserEmployee = await db.employee.findFirst({
        where: { user_id: userId },
        include: {
          OrgAssignment: {
            include: {
              OrgUnit: true,
            },
          },
        },
      });

      if (currentUserEmployee && currentUserEmployee.OrgAssignment.length > 0) {
        const userOrgUnitIds = currentUserEmployee.OrgAssignment.map((a) => a.org_unit_id);

        const subOrgUnits = await db.orgUnit.findMany({
          where: {
            parent_id: { in: userOrgUnitIds },
          },
          select: { id: true },
        });

        const allOrgUnitIds = [...userOrgUnitIds, ...subOrgUnits.map((u) => u.id)];

        return {
          OrgAssignment: {
            some: {
              org_unit_id: { in: allOrgUnitIds },
            },
          },
        };
      }

      return { user_id: userId };
    }

    if (!isAdmin && userId) {
      return { user_id: userId };
    }

    return {};
  }

  /**
   * Get list of employees with scope checking.
   */
  static async getEmployees(userId: bigint | null, userPermissions: string[] = []) {
    const where = await this.getScopedWhereClause(userId, userPermissions);

    return db.employee.findMany({
      where,
      include: {
        User: true,
        OrgAssignment: {
          include: {
            OrgUnit: true,
            JobPosition: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get employee by ID.
   */
  static async getEmployeeById(id: bigint) {
    return db.employee.findUnique({
      where: { id },
      include: {
        User: true,
        OrgAssignment: {
          include: {
            OrgUnit: true,
            JobPosition: true,
          },
        },
        EmployeeAcademicTitle: {
          include: { AcademicTitle: true },
        },
        EmployeeQualification: {
          include: { Qualification: true },
        },
        EmployeeTraining: {
          include: { Training: true },
        },
      },
    });
  }

  /**
   * Search employees by keyword (name, code, email, etc.)
   */
  static async searchEmployees(query: string, limit = 20) {
    const trimmed = query.trim();

    return db.employee.findMany({
      where: trimmed
        ? {
            OR: [
              { employee_no: { contains: trimmed, mode: 'insensitive' } },
              {
                User: {
                  OR: [
                    { full_name: { contains: trimmed, mode: 'insensitive' } },
                    { email: { contains: trimmed, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {},
      take: limit,
      include: {
        User: true,
        OrgAssignment: {
          include: {
            OrgUnit: true,
            JobPosition: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
