import {
  ProgramBlockGroupType,
  ProgramBlockType,
  ProgramPriority,
  ProgramStatus,
  getProgramBlockGroupBaseType,
  normalizeProgramBlockType,
} from '@/constants/programs';

export type ProgramOutcomeCategory = 'general' | 'specific';

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

export interface ProgramApiResponseItem {
  id: string;
  code?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  description?: string | null;
  version?: string | null;
  status?: ProgramStatus | string | null;
  total_credits?: number | null;
  priority?: ProgramPriority | string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  orgUnit?: {
    id: string;
    code: string;
    name: string;
  } | null;
  major?: {
    id: string;
    name_vi: string;
    degree_level?: string | null;
    duration_years?: number | null;
  } | null;
  stats?: {
    student_count?: number;
    block_count?: number;
    course_count?: number;
  };
  ProgramBlock?: ProgramBlockApiItem[];
  ProgramCourseMap?: ProgramCourseMapApiItem[];
  plo?: unknown;
  unified_workflow?: unknown;
}

export interface ProgramListApiData {
  items: ProgramApiResponseItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProgramListApiResponse {
  success: boolean;
  data?: ProgramListApiData;
  error?: string;
}

export interface ProgramCourseMapApiItem {
  id?: string | number | null;
  course_id?: string | number | null;
  is_required?: boolean | null;
  display_order?: number | null;
  group_id?: string | number | null;
  Course?: {
    id?: string | number | null;
    code?: string | null;
    name_vi?: string | null;
    credits?: number | null;
  };
}

export interface ProgramBlockGroupRuleApiRaw {
  id?: string | number | null;
  min_credits?: number | string | null;
  max_credits?: number | string | null;
  min_courses?: number | null;
  max_courses?: number | null;
}

export interface ProgramBlockGroupApiRaw {
  id?: string | number | null;
  code: string;
  title: string;
  group_type: string;
  display_order?: number | null;
  ProgramBlockGroupRule?: ProgramBlockGroupRuleApiRaw[];
}

export interface ProgramBlockApiItem {
  id?: string | number | null;
  code: string;
  title: string;
  block_type: ProgramBlockType | string;
  display_order?: number | null;
  ProgramCourseMap?: ProgramCourseMapApiItem[];
  ProgramBlockGroup?: ProgramBlockGroupApiRaw[];
}

export interface ProgramListItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn?: string;
  description?: string;
  version?: string;
  status: ProgramStatus;
  totalCredits: number;
  priority: ProgramPriority;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdAt?: string;
  updatedAt?: string;
  orgUnit?: {
    id: string;
    code: string;
    name: string;
  } | null;
  major?: {
    id: string;
    name: string;
    degreeLevel?: string | null;
    durationYears?: number | null;
  } | null;
  stats: {
    studentCount: number;
    blockCount: number;
    courseCount: number;
  };
}

export interface ProgramCourseItem {
  id: string;
  mapId: string;
  code: string;
  name: string;
  credits: number;
  required: boolean;
  displayOrder: number;
  courseId: string;
  groupId: string | null;
}

export interface ProgramBlockItem {
  id: string;
  code: string;
  title: string;
  blockType: ProgramBlockType;
  displayOrder: number;
  courses: ProgramCourseItem[];
  groups: ProgramBlockGroupItem[];
}

export interface ProgramDetail extends ProgramListItem {
  plo?: unknown;
  blocks: ProgramBlockItem[];
  standaloneCourses: ProgramCourseItem[];
}

export interface ProgramBlockGroupRuleItem {
  id: string;
  minCredits: number | null;
  maxCredits: number | null;
  minCourses: number | null;
  maxCourses: number | null;
}

export interface ProgramBlockGroupItem {
  id: string;
  code: string;
  title: string;
  groupType: ProgramBlockGroupType;
  rawGroupType: string;
  displayOrder: number;
  rules: ProgramBlockGroupRuleItem[];
}

export interface ProgramOutcomeFormItem {
  id: string;
  label: string;
  category: ProgramOutcomeCategory;
}

export interface ProgramCourseFormItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  required: boolean;
  displayOrder: number;
  groupId?: string | null;
}

export interface ProgramBlockFormItem {
  id: string;
  code: string;
  title: string;
  blockType: ProgramBlockType;
  displayOrder: number;
  courses: ProgramCourseFormItem[];
  groups: ProgramBlockGroupItem[];
}

export interface ProgramFormState {
  code: string;
  nameVi: string;
  nameEn: string;
  description: string;
  orgUnitId: string;
  majorId: string;
  version: string;
  totalCredits: number;
  status: ProgramStatus;
  effectiveFrom: string;
  effectiveTo: string;
  outcomes: ProgramOutcomeFormItem[];
  blocks: ProgramBlockFormItem[];
  standaloneCourses: ProgramCourseFormItem[];
}

const dateToInput = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().split('T')[0];
};

const nowISODate = () => new Date().toISOString().split('T')[0];

const safeId = (seed?: string | number | null, prefix: string = 'temp'): string => {
  if (seed !== undefined && seed !== null && seed !== '') return String(seed);
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
};

export const createEmptyOutcome = (category: ProgramOutcomeCategory = 'general'): ProgramOutcomeFormItem => ({
  id: safeId(null, 'outcome'),
  label: '',
  category,
});

export const createEmptyBlock = (): ProgramBlockFormItem => ({
  id: safeId(null, 'block'),
  code: '',
  title: '',
  blockType: ProgramBlockType.CORE,
  displayOrder: 1,
  courses: [],
  groups: [],
});

export const createEmptyCourse = (): ProgramCourseFormItem => ({
  id: safeId(null, 'course'),
  courseId: '',
  courseCode: '',
  courseName: '',
  credits: 0,
  required: true,
  displayOrder: 1,
  groupId: null,
});

export const createDefaultProgramForm = (): ProgramFormState => ({
  code: '',
  nameVi: '',
  nameEn: '',
  description: '',
  orgUnitId: '',
  majorId: '',
  version: String(new Date().getFullYear()),
  totalCredits: 120,
  status: ProgramStatus.DRAFT,
  effectiveFrom: nowISODate(),
  effectiveTo: '',
  outcomes: [],
  blocks: [],
  standaloneCourses: [],
});

export const mapOrgUnitOptions = (items: OrgUnitApiItem[]): OrgUnitOption[] =>
  items.map((item) => ({
    id: (item.id ?? item.value ?? '').toString(),
    code: item.code,
    name: item.name,
    label: item.label ?? `${item.code} - ${item.name}`,
  }));

export const mapPloToOutcomeItems = (plo: unknown): ProgramOutcomeFormItem[] => {
  if (!Array.isArray(plo)) return [];

  return (
    plo
      .map((item) => {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const label = String(record.label ?? '').trim();
          const categoryValue = typeof record.category === 'string' ? record.category.toLowerCase() : 'general';
          const category: ProgramOutcomeCategory = categoryValue === 'specific' ? 'specific' : 'general';
          return {
            id: safeId(record.id as string | number | null | undefined, 'outcome'),
            label,
            category,
          };
        }
        if (typeof item === 'string') {
          return {
            id: safeId(item, 'outcome'),
            label: item,
            category: 'general' as ProgramOutcomeCategory,
          };
        }
        return null;
      })
      .filter(Boolean) as ProgramOutcomeFormItem[]
  );
};

export const mapProgramResponse = (program: ProgramApiResponseItem): ProgramListItem => ({
  id: program.id?.toString() ?? '',
  code: program.code ?? '—',
  nameVi: program.name_vi ?? 'Chưa đặt tên',
  nameEn: program.name_en ?? undefined,
  description: program.description ?? undefined,
  version: program.version ?? undefined,
  status: (program.status ?? ProgramStatus.DRAFT) as ProgramStatus,
  totalCredits: program.total_credits ?? 0,
  priority: (program.priority ?? ProgramPriority.MEDIUM) as ProgramPriority,
  effectiveFrom: program.effective_from ?? null,
  effectiveTo: program.effective_to ?? null,
  createdAt: program.created_at ?? undefined,
  updatedAt: program.updated_at ?? undefined,
  // Some API responses may use `OrgUnit` (Prisma include default) instead of `orgUnit`. Handle both.
  orgUnit: (program.orgUnit ?? (program as unknown as { OrgUnit?: { id?: string | number; code: string; name: string } | null }).OrgUnit)
    ? {
        id: (program.orgUnit ?? (program as unknown as { OrgUnit?: { id?: string | number } }).OrgUnit)?.id?.toString() ?? '',
        code: (program.orgUnit ?? (program as unknown as { OrgUnit?: { code: string } }).OrgUnit)!.code,
        name: (program.orgUnit ?? (program as unknown as { OrgUnit?: { name: string } }).OrgUnit)!.name,
      }
    : null,
  // Similarly, handle `Major` vs `major` differences gracefully.
  major: (program.major ?? (program as unknown as { Major?: { id?: string | number; name_vi: string; degree_level?: string | null; duration_years?: number | null } | null }).Major)
    ? {
        id: (program.major ?? (program as unknown as { Major?: { id?: string | number } }).Major)?.id?.toString() ?? '',
        name: (program.major ?? (program as unknown as { Major?: { name_vi: string } }).Major)!.name_vi,
        degreeLevel: (program.major ?? (program as unknown as { Major?: { degree_level?: string | null } }).Major)?.degree_level ?? null,
        durationYears: (program.major ?? (program as unknown as { Major?: { duration_years?: number | null } }).Major)?.duration_years ?? null,
      }
    : null,
  stats: {
    studentCount: program.stats?.student_count ?? 0,
    blockCount: program.stats?.block_count ?? 0,
    courseCount: program.stats?.course_count ?? 0,
  },
});

export const mapProgramDetail = (data: ProgramApiResponseItem): ProgramDetail => {
  const summary = mapProgramResponse(data);

  const blockItems = Array.isArray(data.ProgramBlock) ? data.ProgramBlock : [];
  const blocks: ProgramBlockItem[] = blockItems.map((block, blockIndex) => {
    const courseItems = Array.isArray(block.ProgramCourseMap) ? block.ProgramCourseMap : [];
    const groupItems = Array.isArray(block.ProgramBlockGroup) ? block.ProgramBlockGroup : [];
    return {
      id: safeId(block.id, 'block'),
      code: block.code,
      title: block.title,
      blockType: normalizeProgramBlockType(block.block_type),
      displayOrder: block.display_order ?? blockIndex + 1,
      courses: courseItems.map((courseMap, courseIndex) => ({
        id: safeId(courseMap.Course?.id ?? courseMap.id, 'course'),
        mapId: safeId(courseMap.id, 'map'),
        code: courseMap.Course?.code ?? '—',
        name: courseMap.Course?.name_vi ?? 'Chưa đặt tên',
        credits: courseMap.Course?.credits ?? 0,
        required: courseMap.is_required ?? true,
        displayOrder: courseMap.display_order ?? courseIndex + 1,
        courseId:
          courseMap.course_id != null
            ? courseMap.course_id.toString()
            : courseMap.Course?.id != null
            ? courseMap.Course.id.toString()
            : '',
        groupId:
          courseMap.group_id != null
            ? courseMap.group_id.toString()
            : null,
      })),
      groups: groupItems.map((group, groupIndex) => {
        const baseType = getProgramBlockGroupBaseType(group.group_type);
        const rules = Array.isArray(group.ProgramBlockGroupRule) ? group.ProgramBlockGroupRule : [];
        return {
          id: safeId(group.id, 'group'),
          code: group.code,
          title: group.title,
          groupType: baseType,
          rawGroupType: (group.group_type ?? '').toString(),
          displayOrder: group.display_order ?? groupIndex + 1,
          rules: rules.map((rule) => ({
            id: safeId(rule.id, 'rule'),
            minCredits: rule.min_credits != null ? Number(rule.min_credits) : null,
            maxCredits: rule.max_credits != null ? Number(rule.max_credits) : null,
            minCourses: rule.min_courses ?? null,
            maxCourses: rule.max_courses ?? null,
          })),
        };
      }),
    };
  });

  const standaloneItems = Array.isArray(data.ProgramCourseMap) ? data.ProgramCourseMap : [];
  const standaloneCourses: ProgramCourseItem[] = standaloneItems.map((courseMap, index) => ({
    id: safeId(courseMap.Course?.id ?? courseMap.id, 'course'),
    mapId: safeId(courseMap.id, 'map'),
    code: courseMap.Course?.code ?? '—',
    name: courseMap.Course?.name_vi ?? 'Chưa đặt tên',
    credits: courseMap.Course?.credits ?? 0,
    required: courseMap.is_required ?? true,
    displayOrder: courseMap.display_order ?? index + 1,
    courseId:
      courseMap.course_id != null
        ? courseMap.course_id.toString()
        : courseMap.Course?.id != null
        ? courseMap.Course.id.toString()
        : '',
    groupId: null,
  }));

  return {
    ...summary,
    plo: data.plo ?? undefined,
    blocks,
    standaloneCourses,
  };
};

export const mapProgramDetailToForm = (detail: ProgramDetail): ProgramFormState => ({
  code: detail.code ?? '',
  nameVi: detail.nameVi ?? '',
  nameEn: detail.nameEn ?? '',
  description: detail.description ?? '',
  orgUnitId: detail.orgUnit?.id ?? '',
  majorId: detail.major?.id ?? '',
  version: detail.version ?? String(new Date().getFullYear()),
  totalCredits: detail.totalCredits ?? 0,
  status: detail.status ?? ProgramStatus.DRAFT,
  effectiveFrom: dateToInput(detail.effectiveFrom),
  effectiveTo: dateToInput(detail.effectiveTo),
  outcomes: mapPloToOutcomeItems(detail.plo),
  blocks: detail.blocks.map((block, index) => ({
    id: block.id || safeId(null, `block-${index}`),
    code: block.code,
    title: block.title,
    blockType: block.blockType,
    displayOrder: block.displayOrder ?? index + 1,
    courses: block.courses.map((course, courseIndex) => ({
      id: course.id || safeId(null, `course-${index}-${courseIndex}`),
      courseId: course.courseId,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      required: course.required,
      displayOrder: course.displayOrder ?? courseIndex + 1,
      groupId: course.groupId ?? null,
    })),
    groups: block.groups,
  })),
  standaloneCourses: detail.standaloneCourses.map((course, index) => ({
    id: course.id || safeId(null, `standalone-${index}`),
    courseId: course.courseId,
    courseCode: course.code,
    courseName: course.name,
    credits: course.credits,
    required: course.required,
    displayOrder: course.displayOrder ?? index + 1,
  })),
});

export const buildProgramPayloadFromForm = (form: ProgramFormState) => ({
  code: form.code.trim(),
  name_vi: form.nameVi.trim(),
  name_en: form.nameEn.trim() || undefined,
  description: form.description.trim() || undefined,
  version: form.version.trim() || undefined,
  total_credits: Number(form.totalCredits) || 0,
  status: form.status,
  org_unit_id: form.orgUnitId ? Number(form.orgUnitId) : undefined,
  major_id: form.majorId ? Number(form.majorId) : undefined,
  effective_from: form.effectiveFrom || undefined,
  effective_to: form.effectiveTo || undefined,
  plo: form.outcomes.length
    ? form.outcomes.map((outcome) => ({
        id: outcome.id,
        label: outcome.label.trim(),
        category: outcome.category,
      }))
    : undefined,
  blocks: form.blocks.map((block, index) => ({
    code: block.code.trim(),
    title: block.title.trim(),
    block_type: normalizeProgramBlockType(block.blockType),
    display_order: Math.max(1, block.displayOrder || index + 1),
    groups: block.groups.map((group, groupIndex) => ({
      code: group.code,
      title: group.title,
      group_type: group.rawGroupType || group.groupType,
      display_order: Math.max(1, group.displayOrder || groupIndex + 1),
      rules: group.rules.map((rule) => ({
        min_credits: rule.minCredits,
        max_credits: rule.maxCredits,
        min_courses: rule.minCourses,
        max_courses: rule.maxCourses,
      })),
    })),
    courses: block.courses
      .filter((course) => course.courseId)
      .map((course, courseIndex) => ({
        course_id: Number(course.courseId),
        is_required: course.required,
        display_order: Math.max(1, course.displayOrder || courseIndex + 1),
        // map course.groupId to the corresponding group's code for stable server mapping
        group_code:
          (block.groups.find((g) => g.id === course.groupId)?.code) || undefined,
      })),
  })),
  standalone_courses: form.standaloneCourses
    .filter((course) => course.courseId)
    .map((course, index) => ({
      course_id: Number(course.courseId),
      is_required: course.required,
      display_order: Math.max(1, course.displayOrder || index + 1),
      group_id: course.groupId ? Number(course.groupId) : undefined,
    })),
});
