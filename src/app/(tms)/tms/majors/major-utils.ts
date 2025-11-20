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

export interface MajorApiResponseItem {
  id: string | number;
  code?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  short_name?: string | null;
  slug?: string | null;
  degree_level?: string | null;
  org_unit_id?: string | number | null;
  duration_years?: number | string | null;
  total_credits_min?: number | string | null;
  total_credits_max?: number | string | null;
  semesters_per_year?: number | string | null;
  status?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MajorListApiData {
  items: MajorApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MajorListApiResponse {
  success: boolean;
  data?: MajorListApiData;
  error?: string;
}

export interface MajorListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  shortName?: string;
  slug?: string;
  degreeLevel: string;
  orgUnitId: string;
  durationYears?: number;
  totalCreditsMin?: number;
  totalCreditsMax?: number;
  semestersPerYear?: number;
  status: string;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

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

