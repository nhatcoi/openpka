import { CurriculumStructure, CurriculumSemesterItem, CurriculumCourseItem } from '@/types/curriculum';

const createEmptyStructure = (raw?: unknown): CurriculumStructure => ({
  semesters: [],
  summary: {
    semesters: 0,
    courseCount: 0,
    totalCredits: 0,
    requiredCredits: 0,
    optionalCredits: 0,
  },
  raw,
});

const safeString = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (value && typeof value === 'object' && 'toNumber' in (value as Record<string, unknown>)) {
    try {
      const result = (value as { toNumber: () => number }).toNumber();
      return Number.isFinite(result) ? result : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const coerceCourses = (rawCourses: unknown, fallbackIdPrefix: string): CurriculumCourseItem[] => {
  if (!Array.isArray(rawCourses)) return [];

  return rawCourses
    .map((item, courseIndex) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;

      const idSeed = record.id ?? record.courseId ?? record.course_id ?? record.code ?? courseIndex + 1;
      const id = safeString(idSeed, `${fallbackIdPrefix}-${courseIndex + 1}`);
      const courseId = safeString(record.courseId ?? record.course_id ?? idSeed, id);
      const code = safeString(record.code ?? record.courseCode ?? record.course_code ?? record.number, '—');
      const name = safeString(record.name ?? record.name_vi ?? record.title ?? record.course_name, 'Chưa cập nhật');
      const credits = toNumber(record.credits ?? record.credit ?? record.credit_hours ?? record.totalCredits ?? 0, 0);
      const requiredValue = record.required ?? record.is_required ?? record.mandatory ?? record.core;
      const required = typeof requiredValue === 'boolean' ? requiredValue : String(requiredValue ?? '').toLowerCase() === 'true';

      const blockCode = record.blockCode ?? record.block_code ?? record.blockId ?? record.block_id ?? record.block;
      const blockTitle = record.blockTitle ?? record.block_title ?? record.blockName ?? record.block_name;
      const groupCode = record.groupCode ?? record.group_code ?? record.groupId ?? record.group_id ?? record.group;
      const groupTitle = record.groupTitle ?? record.group_title ?? record.groupName ?? record.group_name;
      const note = record.note ?? record.notes ?? null;

      return {
        id,
        courseId,
        code,
        name,
        credits,
        required,
        blockCode: blockCode != null ? safeString(blockCode, null as unknown as string) : null,
        blockTitle: blockTitle != null ? safeString(blockTitle, null as unknown as string) : null,
        groupCode: groupCode != null ? safeString(groupCode, null as unknown as string) : null,
        groupTitle: groupTitle != null ? safeString(groupTitle, null as unknown as string) : null,
        note: typeof note === 'string' ? note : null,
      } satisfies CurriculumCourseItem;
    })
    .filter(Boolean) as CurriculumCourseItem[];
};

const normalizeSemesters = (rawSemesters: unknown): CurriculumSemesterItem[] => {
  if (!Array.isArray(rawSemesters)) return [];

  return rawSemesters
    .map((item, semIndex) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;

      const idSeed = record.id ?? record.code ?? record.name ?? record.semester ?? semIndex + 1;
      const id = safeString(idSeed, `semester-${semIndex + 1}`);
      const name = safeString(
        record.name ?? record.title ?? record.semesterLabel ?? record.semester_name,
        `Học kỳ ${semIndex + 1}`,
      );
      const orderValue = record.order ?? record.display_order ?? record.semester ?? semIndex + 1;
      const order = toNumber(orderValue, semIndex + 1);
      const note = typeof record.note === 'string' ? record.note : typeof record.description === 'string' ? record.description : null;

      const courses = coerceCourses(record.courses ?? record.subjects ?? record.modules, id);
      const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
      const requiredCredits = courses
        .filter((course) => course.required)
        .reduce((sum, course) => sum + (course.credits || 0), 0);
      const optionalCredits = totalCredits - requiredCredits;

      return {
        id,
        name,
        order,
        note,
        courses,
        totalCredits,
        requiredCredits,
        optionalCredits,
        courseCount: courses.length,
      } satisfies CurriculumSemesterItem;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order) as CurriculumSemesterItem[];
};

const summarizeSemesters = (semesters: CurriculumSemesterItem[]) => {
  const aggregate = semesters.reduce(
    (acc, semester) => {
      acc.semesters += 1;
      acc.courseCount += semester.courseCount;
      acc.totalCredits += semester.totalCredits;
      acc.requiredCredits += semester.requiredCredits;
      acc.optionalCredits += semester.optionalCredits;
      return acc;
    },
    {
      semesters: 0,
      courseCount: 0,
      totalCredits: 0,
      requiredCredits: 0,
      optionalCredits: 0,
    },
  );

  return aggregate;
};

export const parseCurriculumStructure = (raw: unknown): CurriculumStructure => {
  if (!raw) {
    return createEmptyStructure();
  }

  let data: unknown = raw;

  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return createEmptyStructure(raw);
    }
  }

  if (Array.isArray(data)) {
    const semesters = normalizeSemesters(data);
    const summary = summarizeSemesters(semesters);
    return { semesters, summary, raw };
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    if (Array.isArray(record.semesters)) {
      const semesters = normalizeSemesters(record.semesters);
      const summary = summarizeSemesters(semesters);
      return { semesters, summary, raw };
    }

    if (Array.isArray(record.blocks)) {
      const blocks = record.blocks as unknown[];
      const semestersFromBlocks = blocks.flatMap((block, blockIndex) => {
        if (!block || typeof block !== 'object') return [];
        const blockRecord = block as Record<string, unknown>;
        const blockCourses = coerceCourses(blockRecord.courses ?? blockRecord.subjects ?? [], `block-${blockIndex + 1}`);

        if (!Array.isArray(blockRecord.semesters)) {
          if (blockCourses.length === 0) return [];
          return [
            {
              id: safeString(blockRecord.id ?? blockRecord.code ?? `block-${blockIndex + 1}`),
              name: safeString(blockRecord.name ?? blockRecord.title ?? `Khối ${blockIndex + 1}`),
              order: blockIndex + 1,
              note: typeof blockRecord.note === 'string' ? blockRecord.note : null,
              courses: blockCourses,
              totalCredits: blockCourses.reduce((sum, course) => sum + (course.credits || 0), 0),
              requiredCredits: blockCourses
                .filter((course) => course.required)
                .reduce((sum, course) => sum + (course.credits || 0), 0),
              optionalCredits: blockCourses
                .filter((course) => !course.required)
                .reduce((sum, course) => sum + (course.credits || 0), 0),
              courseCount: blockCourses.length,
            } satisfies CurriculumSemesterItem,
          ];
        }

        return normalizeSemesters(blockRecord.semesters);
      });

      const summary = summarizeSemesters(semestersFromBlocks);
      return { semesters: semestersFromBlocks, summary, raw };
    }
  }

  return createEmptyStructure(raw);
};
