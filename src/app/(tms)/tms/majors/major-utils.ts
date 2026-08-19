import { WorkflowStatus } from '@/constants/workflow-statuses';
import {
  OrgUnitApiItem,
  OrgUnitOption,
  MajorApiResponseItem,
  MajorListApiData,
  MajorListApiResponse,
  MajorListItem,
  PaginationState,
} from '@/features/tms';

export type {
  OrgUnitApiItem,
  OrgUnitOption,
  MajorApiResponseItem,
  MajorListApiData,
  MajorListApiResponse,
  MajorListItem,
  PaginationState,
};

export const mapOrgUnitOptions = (items: OrgUnitApiItem[]): OrgUnitOption[] =>
  items.map((item) => ({
    id: (item.id ?? item.value ?? '').toString(),
    code: item.code,
    name: item.name,
    label: item.label ?? `${item.code} - ${item.name}`,
  }));

export const mapMajorResponse = (major: MajorApiResponseItem): MajorListItem => ({
  id: major.id?.toString() ?? '',
  code: major.code ?? '—',
  nameVi: major.name_vi ?? 'Chưa đặt tên',
  nameEn: major.name_en ?? undefined,
  shortName: major.short_name ?? undefined,
  slug: major.slug ?? undefined,
  degreeLevel: major.degree_level ?? '',
  orgUnitId: major.org_unit_id?.toString() ?? '',
  durationYears: major.duration_years ? Number(major.duration_years) : undefined,
  totalCreditsMin: major.total_credits_min ? Number(major.total_credits_min) : undefined,
  totalCreditsMax: major.total_credits_max ? Number(major.total_credits_max) : undefined,
  semestersPerYear: major.semesters_per_year ? Number(major.semesters_per_year) : undefined,
  status: (major.status ?? WorkflowStatus.DRAFT) as string,
  closedAt: major.closed_at ?? null,
  createdAt: major.created_at ?? undefined,
  updatedAt: major.updated_at ?? undefined,
});

