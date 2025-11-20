import { WorkflowStatus } from '@/constants/workflow-statuses';

export interface OrgUnitApiItem {
  id?: string | number | null;
  value?: string | number | null;
  code: string;
  name: string;
  label?: string | null;
}

export interface OrgUnitOption {
  id: string;
  code: string;
  name: string;
  label: string;
}

export interface CourseApiResponseItem {
  id: string | number;
  code?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  credits?: number | string | null;
  theory_credit?: number | string | null;
  practical_credit?: number | string | null;
  type?: string | null;
  status?: string | null;
  org_unit_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  OrgUnit?: {
    id?: string | number | null;
    name: string;
    code?: string | null;
  } | null;
}

export interface CourseListApiData {
  items: CourseApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CourseListApiResponse {
  success: boolean;
  data?: CourseListApiData;
  error?: string;
}

export interface CourseListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  credits: number;
  theoryCredit: number;
  practicalCredit: number;
  type: string;
  status: string;
  orgUnitId?: string;
  createdAt?: string;
  updatedAt?: string;
  orgUnit?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

const formatCredit = (value: any): number => {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'object' && value.toNumber) {
    return value.toNumber();
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  return 0;
};

export const mapOrgUnitOptions = (items: OrgUnitApiItem[]): OrgUnitOption[] =>
  items.map((item) => ({
    id: (item.id ?? item.value ?? '').toString(),
    code: item.code,
    name: item.name,
    label: item.label ?? `${item.code} - ${item.name}`,
  }));

export const mapCourseResponse = (course: CourseApiResponseItem): CourseListItem => ({
  id: course.id?.toString() ?? '',
  code: course.code ?? '—',
  nameVi: course.name_vi ?? 'Chưa đặt tên',
  nameEn: course.name_en ?? undefined,
  credits: formatCredit(course.credits),
  theoryCredit: formatCredit(course.theory_credit),
  practicalCredit: formatCredit(course.practical_credit),
  type: course.type ?? '',
  status: (course.status ?? WorkflowStatus.DRAFT) as string,
  orgUnitId: course.org_unit_id?.toString(),
  createdAt: course.created_at ?? undefined,
  updatedAt: course.updated_at ?? undefined,
  orgUnit: course.OrgUnit
    ? {
        id: course.OrgUnit.id?.toString() ?? '',
        code: course.OrgUnit.code ?? '',
        name: course.OrgUnit.name,
      }
    : null,
});

