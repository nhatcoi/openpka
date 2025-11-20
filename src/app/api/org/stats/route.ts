import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/api/api-handler';
import { db } from '@/lib/db';

// GET /api/org/stats
export const GET = withErrorHandling(
  async (request: NextRequest) => {
    // Get total units count
    const totalUnits = await db.orgUnit.count();

    // Get active/inactive units count
    const [activeUnits, inactiveUnits] = await Promise.all([
      db.orgUnit.count({ where: { status: 'ACTIVE' } }),
      db.orgUnit.count({ where: { status: 'INACTIVE' } })
    ]);

    // Get units by type
    const [departments, divisions, teams, branches] = await Promise.all([
      db.orgUnit.count({ where: { type: 'DEPARTMENT' } }),
      db.orgUnit.count({ where: { type: 'DIVISION' } }),
      db.orgUnit.count({ where: { type: 'TEAM' } }),
      db.orgUnit.count({ where: { type: 'BRANCH' } })
    ]);

    const totalEmployees = await db.orgAssignment.count({
      where: {
        end_date: null // Only active assignments
      }
    });

    const topUnits = await db.orgUnit.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        _count: {
          select: {
            OrgAssignment: {
              where: {
                end_date: null // active
              }
            }
          }
        }
      },
      orderBy: {
        OrgAssignment: {
          _count: 'desc'
        }
      },
      take: 5
    });

    const stats = {
      totalUnits,
      totalEmployees,
      activeUnits,
      inactiveUnits,
      departments,
      divisions,
      teams,
      branches,
      topUnits
    };

    return stats;
  },
  'fetch organization stats'
);
