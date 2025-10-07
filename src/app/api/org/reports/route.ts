import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/reports - Get organization statistics and reports
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';

    switch (reportType) {
      case 'overview':
        return await getOverviewStats();
      case 'units-without-head':
        return await getUnitsWithoutHead();
      case 'units-without-staff':
        return await getUnitsWithoutStaff();
      case 'employee-distribution':
        return await getEmployeeDistribution();
      case 'unit-status-summary':
        return await getUnitStatusSummary();
      default:
        return await getOverviewStats();
    }
  },
  'fetch org reports'
);

async function getOverviewStats() {
  const [
    totalUnits,
    totalEmployees,
    activeUnits,
    inactiveUnits,
    unitsWithEmployees,
    unitsWithoutEmployees,
    totalAssignments
  ] = await Promise.all([
    db.orgUnit.count(),
    db.employee.count({ where: { status: 'ACTIVE' } }),
    db.orgUnit.count({ where: { status: 'ACTIVE' } }),
    db.orgUnit.count({ where: { status: 'INACTIVE' } }),
    db.orgUnit.count({
      where: {
        OrgAssignment: {
          some: {}
        }
      }
    }),
    db.orgUnit.count({
      where: {
        OrgAssignment: {
          none: {}
        }
      }
    }),
    db.orgAssignment.count()
  ]);

  const stats = {
    totalUnits,
    totalEmployees,
    activeUnits,
    inactiveUnits,
    unitsWithEmployees,
    unitsWithoutEmployees,
    totalAssignments,
    unitsWithoutHead: totalUnits - unitsWithEmployees
  };

  return stats;
}

async function getUnitsWithoutHead() {
  const units = await db.orgUnit.findMany({
    where: {
      OrgAssignment: {
        none: {
          position_id: {
            not: null
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      status: true,
      created_at: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  const unitsWithoutHead = units.map(unit => {
    const createdDate = new Date(unit.created_at || new Date());
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: unit.id.toString(),
      name: unit.name,
      code: unit.code,
      type: unit.type,
      status: unit.status,
      daysWithoutHead: daysDiff
    };
  });

  return unitsWithoutHead;
}

async function getUnitsWithoutStaff() {
  const units = await db.orgUnit.findMany({
    where: {
      OrgAssignment: {
        none: {}
      }
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      status: true,
      created_at: true
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  const unitsWithoutStaff = units.map(unit => ({
    id: unit.id.toString(),
    name: unit.name,
    code: unit.code,
    type: unit.type,
    status: unit.status
  }));

  return unitsWithoutStaff;
}

async function getEmployeeDistribution() {
  const distribution = await db.orgUnit.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      status: true,
      _count: {
        select: {
          OrgAssignment: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  const result = distribution.map(unit => ({
    id: unit.id.toString(),
    name: unit.name,
    code: unit.code,
    type: unit.type,
    status: unit.status,
    employeeCount: unit._count.OrgAssignment
  }));

  return result;
}

async function getUnitStatusSummary() {
  const statusSummary = await db.orgUnit.groupBy({
    by: ['status'],
    _count: {
      status: true
    },
    orderBy: {
      status: 'asc'
    }
  });

  const result = statusSummary.map(item => ({
    status: item.status || 'UNKNOWN',
    count: item._count.status
  }));

  return result;
}
