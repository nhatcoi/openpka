import { WorkflowStatus } from '@/constants/workflow-statuses';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  CourseApiResponseItem,
  CourseListApiData,
  CourseListApiResponse,
  CourseListItem,
  PaginationState,
} from '@/features/tms';

export type {
  OrgUnitApiItem,
  OrgUnitOption,
  CourseApiResponseItem,
  CourseListApiData,
  CourseListApiResponse,
  CourseListItem,
  PaginationState,
};

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

