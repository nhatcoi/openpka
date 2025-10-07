// Hierarchical permission utilities
import { db } from '../db';

export interface UserOrgUnit {
  id: string;
  name: string;
  parent_id: string | null;
  type: string;
  status: string;
}

/**
 * Lấy tất cả đơn vị con của một đơn vị (recursive)
 */
export async function getChildUnits(unitId: string): Promise<UserOrgUnit[]> {
  const units = await db.orgUnit.findMany({
    where: {
      parent_id: BigInt(unitId)
    },
    select: {
      id: true,
      name: true,
      parent_id: true,
      type: true,
      status: true
    }
  });

  const result: UserOrgUnit[] = [];
  
  for (const unit of units) {
    result.push({
      id: unit.id.toString(),
      name: unit.name,
      parent_id: unit.parent_id?.toString() || null,
      type: unit.type || '',
      status: unit.status || ''
    });

    // Recursive call để lấy đơn vị con của đơn vị con
    const childUnits = await getChildUnits(unit.id.toString());
    result.push(...childUnits);
  }

  return result;
}

/**
 * Kiểm tra user có quyền truy cập đơn vị không
 */
export async function canAccessOrgUnit(
  userId: string, 
  targetUnitId: string,
  action: 'read' | 'create' | 'update' | 'delete' = 'read'
): Promise<boolean> {
  try {
    // 1. Lấy đơn vị của user (từ OrgAssignment)
    const userAssignment = await db.orgAssignment.findFirst({
      where: {
        Employee: {
          user_id: BigInt(userId)
        },
        is_primary: true,
        end_date: null // Chỉ assignment đang active
      },
      include: {
        OrgUnit: true
      }
    });

    if (!userAssignment) {
      return false; // User không có assignment
    }

    const userUnitId = userAssignment.OrgUnit.id.toString();

    // 2. Nếu target unit là đơn vị của user
    if (userUnitId === targetUnitId) {
      return true; // Có quyền với đơn vị của mình
    }

    // 3. Kiểm tra target unit có phải là con của user unit không
    const childUnits = await getChildUnits(userUnitId);
    const hasAccess = childUnits.some(unit => unit.id === targetUnitId);

    return hasAccess;
  } catch (error) {
    console.error('Error checking org unit access:', error);
    return false;
  }
}

/**
 * Lấy danh sách đơn vị user có quyền truy cập
 */
export async function getUserAccessibleUnits(userId: string): Promise<UserOrgUnit[]> {
  try {
    // Lấy đơn vị của user
    const userAssignment = await db.orgAssignment.findFirst({
      where: {
        Employee: {
          user_id: BigInt(userId)
        },
        is_primary: true,
        end_date: null
      },
      include: {
        OrgUnit: true
      }
    });

    if (!userAssignment) {
      return [];
    }

    const userUnit: UserOrgUnit = {
      id: userAssignment.OrgUnit.id.toString(),
      name: userAssignment.OrgUnit.name,
      parent_id: userAssignment.OrgUnit.parent_id?.toString() || null,
      type: userAssignment.OrgUnit.type || '',
      status: userAssignment.OrgUnit.status || ''
    };

    // Lấy tất cả đơn vị con
    const childUnits = await getChildUnits(userUnit.id);

    console.log('userUnit', userUnit.id);
    console.log('childUnits', childUnits);

    return [userUnit, ...childUnits];
  } catch (error) {
    console.error('Error getting user accessible units:', error);
    return [];
  }
}

/**
 * Middleware để kiểm tra quyền hierarchical
 */
export async function checkHierarchicalPermission(
  userId: string,
  targetUnitId: string,
  action: 'read' | 'create' | 'update' | 'delete' = 'read'
): Promise<{ hasAccess: boolean; reason?: string }> {
  const hasAccess = await canAccessOrgUnit(userId, targetUnitId, action);
  
  if (!hasAccess) {
    return {
      hasAccess: false,
      reason: `User không có quyền ${action} đơn vị ${targetUnitId}`
    };
  }

  return { hasAccess: true };
}
