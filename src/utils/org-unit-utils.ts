import {
  Apartment as ApartmentIcon,
  Group as GroupIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Support as SupportIcon,
  Handshake as HandshakeIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

// Enums for organization unit types and statuses
export enum OrgUnitType {
  DEPARTMENT = 'department',
  DIVISION = 'division',
  TEAM = 'team',
  BRANCH = 'branch',
  FACULTY = 'faculty',
  SCHOOL = 'school',
  UNIVERSITY = 'university',
  UNIVERSITY_COUNCIL = 'university_council',
  CENTER = 'center',
  INSTITUTE = 'institute',
}

export enum OrgUnitStatus {
  // Deletable statuses
  DRAFT = 'draft',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
  
  // Non-deletable statuses
  ACTIVE = 'active',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

/**
 * Get color for organization unit status
 */
export const getStatusColor = (status: string | null): string => {
  switch (status?.toLowerCase()) {
    // Deletable statuses
    case OrgUnitStatus.DRAFT:
      return '#9e9e9e'; // Grey - Draft
    case OrgUnitStatus.REJECTED:
      return '#f44336'; // Red - Rejected
    case OrgUnitStatus.INACTIVE:
      return '#ff5722'; // Deep Orange - Inactive
    
    // Non-deletable statuses
    case OrgUnitStatus.ACTIVE:
      return '#4caf50'; // Green - Active
    case OrgUnitStatus.APPROVED:
      return '#2196f3'; // Blue - Approved
    case OrgUnitStatus.SUSPENDED:
      return '#ff9800'; // Orange - Suspended
    case OrgUnitStatus.ARCHIVED:
      return '#607d8b'; // Blue Grey - Archived
    
    default:
      return '#666666'; // Default grey
  }
};

/**
 * Get color for organization unit type
 */
export const getTypeColor = (type: string | null): string => {
  switch (type?.toLowerCase()) {
    case OrgUnitType.DEPARTMENT:
      return '#2e4c92'; // Blue - Department
    case OrgUnitType.DIVISION:
      return '#2e4c92'; // Blue - Division
    case OrgUnitType.TEAM:
      return '#ff8c00'; // Orange - Team
    case OrgUnitType.BRANCH:
      return '#ff8c00'; // Orange - Branch
    case OrgUnitType.FACULTY:
      return '#673ab7'; // Purple - Faculty
    case OrgUnitType.SCHOOL:
      return '#3f51b5'; // Indigo - School
    case OrgUnitType.UNIVERSITY:
      return '#1976d2'; // Blue - University
    case OrgUnitType.UNIVERSITY_COUNCIL:
      return '#0d47a1'; // Dark Blue - University Council
    case OrgUnitType.CENTER:
      return '#e91e63'; // Pink - Center
    case OrgUnitType.INSTITUTE:
      return '#795548'; // Brown - Institute
    default:
      return '#666666'; // Default grey
  }
};

/**
 * Get icon for organization unit type
 */
export const getTypeIcon = (type: string | null) => {
  switch (type?.toLowerCase()) {
    case OrgUnitType.DEPARTMENT:
      return ApartmentIcon;
    case OrgUnitType.DIVISION:
      return GroupIcon;
    case OrgUnitType.TEAM:
      return GroupIcon;
    case OrgUnitType.BRANCH:
      return LocationOnIcon;
    case OrgUnitType.FACULTY:
      return ApartmentIcon;
    case OrgUnitType.SCHOOL:
      return BusinessIcon;
    case OrgUnitType.UNIVERSITY:
      return BusinessIcon;
    case OrgUnitType.UNIVERSITY_COUNCIL:
      return BusinessIcon;
    case OrgUnitType.CENTER:
      return BusinessIcon;
    case OrgUnitType.INSTITUTE:
      return BusinessIcon;
    default:
      return BusinessIcon;
  }
};

/**
 * Reset form data to initial state
 */
export const getInitialFormData = () => ({
  name: '',
  code: '',
  type: '',
  description: '',
  parent_id: null,
  status: 'active',
  effective_from: '',
  effective_to: '',
});

/**
 * Map organization unit to form data
 */
export const mapUnitToFormData = (unit: { id: string; name: string; [key: string]: unknown }) => ({
  name: unit.name,
  code: unit.code,
  type: unit.type || '',
  description: unit.description || '',
  parent_id: unit.parent_id,
  status: unit.status || OrgUnitStatus.ACTIVE,
  effective_from: unit.effective_from || '',
  effective_to: unit.effective_to || '',
});

// Relation type utilities
export enum OrgRelationType {
  DIRECT = 'direct',
  ADVISORY = 'advisory', 
  SUPPORT = 'support',
  COLLAB = 'collab',
}

/**
 * Get relation type label in Vietnamese
 */
export const getRelationTypeLabel = (relationType: string): string => {
  switch (relationType) {
    case OrgRelationType.DIRECT:
      return 'Trực tiếp';
    case OrgRelationType.ADVISORY:
      return 'Tư vấn';
    case OrgRelationType.SUPPORT:
      return 'Hỗ trợ';
    case OrgRelationType.COLLAB:
      return 'Hợp tác';
    default:
      return 'Không xác định';
  }
};

