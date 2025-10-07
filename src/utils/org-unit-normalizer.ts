/**
 * Normalize organization unit data to ensure consistent case formatting
 */

export interface OrgUnitInput {
  type?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Normalize type and status to uppercase
 */
export function normalizeOrgUnitData(data: OrgUnitInput): OrgUnitInput {
  return {
    ...data,
    type: data.type?.toUpperCase(),
    status: data.status?.toUpperCase(),
  };
}

/**
 * Normalize only type field
 */
export function normalizeType(type?: string): string | undefined {
  return type?.toUpperCase();
}

/**
 * Normalize only status field
 */
export function normalizeStatus(status?: string): string | undefined {
  return status?.toUpperCase();
}

/**
 * Validate that type is one of the allowed values
 */
export function isValidType(type?: string): boolean {
  if (!type) return false;
  
  const validTypes = [
    'UNIVERSITY', 'FACULTY', 'DEPARTMENT', 'DIVISION', 
    'CENTER', 'INSTITUTE', 'OFFICE', 'BAN'
  ];
  
  return validTypes.includes(type.toUpperCase());
}

/**
 * Validate that status is one of the allowed values
 */
export function isValidStatus(status?: string): boolean {
  if (!status) return false;
  
  const validStatuses = [
    'DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 
    'INACTIVE', 'ARCHIVED', 'REJECTED'
  ];
  
  return validStatuses.includes(status.toUpperCase());
}

/**
 * Get normalized type with fallback
 */
export function getNormalizedType(type?: string, fallback?: string): string | undefined {
  const normalized = normalizeType(type);
  return isValidType(normalized) ? normalized : fallback;
}

/**
 * Get normalized status with fallback
 */
export function getNormalizedStatus(status?: string, fallback?: string): string | undefined {
  const normalized = normalizeStatus(status);
  return isValidStatus(normalized) ? normalized : fallback;
}
