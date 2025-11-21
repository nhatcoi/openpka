interface OrgUnitType {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface OrgUnitStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  workflow_step: number;
  created_at: string;
  updated_at: string;
}

interface DropdownOption {
  value: string;
  label: string;
  deletable?: boolean;
}

/**
 * Convert API types to dropdown options
 */
export const convertTypesToOptions = (types: OrgUnitType[]): DropdownOption[] => {
  return types
    .filter(type => type.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(type => ({
      value: type.code,
      label: `${type.name} (${type.code})`,
    }));
};

/**
 * Convert API statuses to dropdown options
 */
export const convertStatusesToOptions = (statuses: OrgUnitStatus[]): DropdownOption[] => {
  return statuses
    .filter(status => status.is_active)
    .sort((a, b) => a.workflow_step - b.workflow_step)
    .map(status => ({
      value: status.code,
      label: status.name,
      deletable: ['DRAFT', 'REJECTED', 'INACTIVE'].includes(status.code),
    }));
};

/**
 * Get type name from API data
 */
export const getTypeNameFromApi = (typeCode: string | null, types: OrgUnitType[]): string => {
  if (!typeCode) return typeCode || '';
  
  const type = types.find(t => t.code === typeCode);
  return type?.name || typeCode;
};

/**
 * Get status name from API data
 */
export const getStatusNameFromApi = (statusCode: string | null, statuses: OrgUnitStatus[]): string => {
  if (!statusCode) return statusCode || '';
  
  const status = statuses.find(s => s.code === statusCode);
  return status?.name || statusCode;
};

