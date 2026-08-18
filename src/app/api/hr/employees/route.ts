import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { requirePermission } from '@/lib/auth/api-permissions';
import { db } from '@/lib/db';
import { EmployeeService } from '@/features/hr/services/employee.service';
import { apiSuccess, apiError } from '@/lib/api/response';
import { logEmployeeActivity, getActorInfo } from '@/lib/audit-logger';
import {
  formatEmploymentTypeForClient,
  normalizeEmploymentType,
} from '@/features/hr/utils/employment-type';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    requirePermission(session, 'hr.employee.view');

    const currentUserId = session?.user?.id ? BigInt(session.user.id) : null;
    const userPermissions = (session?.user as { permissions?: string[] })?.permissions || [];

    const employees = await EmployeeService.getEmployees(currentUserId, userPermissions);

    // Format employment type for client if needed
    const formatted = employees.map((emp) => ({
      ...emp,
      employment_type: formatEmploymentTypeForClient(emp.employment_type),
    }));

    return apiSuccess(formatted);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return apiError(error instanceof Error ? error.message : 'Database query failed', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    requirePermission(session, 'hr.employee.create');

    const body = await request.json();
    const { user_id, employee_no, employment_type, status, hired_at } = body;
    const currentUserId = BigInt(session.user.id);

    const employee = await db.employee.create({
      data: {
        user_id: BigInt(user_id || session.user.id),
        employee_no,
        employment_type: normalizeEmploymentType(employment_type) || 'FULL_TIME',
        status: status || 'ACTIVE',
        hired_at: hired_at ? new Date(hired_at) : null,
      },
      include: {
        User: true,
      },
    });

    const formattedEmployee = {
      ...employee,
      employment_type: formatEmploymentTypeForClient(employee.employment_type),
    };

    // Log the creation activity
    const actorInfo = getActorInfo(request);
    await logEmployeeActivity({
      employee_id: employee.id,
      action: 'CREATE',
      entity_type: 'employees',
      entity_id: employee.id,
      new_value: JSON.stringify(formattedEmployee),
      actor_id: currentUserId,
      ...actorInfo,
    });

    return apiSuccess(formattedEmployee, 'Tạo nhân viên thành công', 201);
  } catch (error) {
    console.error('Error creating employee:', error);
    return apiError(error instanceof Error ? error.message : 'Failed to create employee', 500);
  }
}
