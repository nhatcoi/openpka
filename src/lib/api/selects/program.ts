export const selectProgramDetail = {
  id: true,
  code: true,
  name_vi: true,
  name_en: true,
  description: true,
  version: true,
  total_credits: true,
  status: true,
  plo: true,
  effective_from: true,
  effective_to: true,
  created_at: true,
  updated_at: true,
  org_unit_id: true,
  major_id: true,
  OrgUnit: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  ProgramBlock: {
    select: {
      id: true,
      code: true,
      title: true,
      block_type: true,
      display_order: true,
      ProgramCourseMap: {
        select: {
          id: true,
          course_id: true,
          is_required: true,
          display_order: true,
          group_id: true,
          Course: {
            select: {
              id: true,
              code: true,
              name_vi: true,
              credits: true,
            },
          },
        },
        orderBy: { display_order: 'asc' },
      },
      ProgramBlockGroup: {
        select: {
          id: true,
          code: true,
          title: true,
          group_type: true,
          display_order: true,
          ProgramBlockGroupRule: {
            select: {
              id: true,
              min_credits: true,
              max_credits: true,
              min_courses: true,
              max_courses: true,
            },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { display_order: 'asc' },
      },
    },
    orderBy: { display_order: 'asc' },
  },
  ProgramCourseMap: {
    where: { block_id: null },
    select: {
      id: true,
      course_id: true,
      is_required: true,
      display_order: true,
      group_id: true,
      Course: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          credits: true,
        },
      },
    },
    orderBy: { display_order: 'asc' },
  },
  _count: {
    select: {
      StudentAcademicProgress: true,
      ProgramBlock: true,
      ProgramCourseMap: true,
    },
  },
} as const;
