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
  ProgramCourseMap: {
    select: {
      id: true,
      course_id: true,
      block_id: true,
      group_id: true,
      is_required: true,
      display_order: true,
      ProgramBlock: {
        select: {
          id: true,
          code: true,
          title: true,
          block_type: true,
          display_order: true,
        },
      },
      ProgramBlockGroup: {
        select: {
          id: true,
          code: true,
          title: true,
          group_type: true,
          display_order: true,
          description: true,
          parent_id: true,
          program_block_group_rules: {
            select: {
              id: true,
              min_credits: true,
              max_credits: true,
              min_courses: true,
              max_courses: true,
              rule_type: true,
            },
            orderBy: { id: 'asc' },
          },
          parent: {
            select: {
              id: true,
              code: true,
              title: true,
              group_type: true,
            },
          },
          children: {
            select: {
              id: true,
              code: true,
              title: true,
              group_type: true,
              display_order: true,
            },
            orderBy: { display_order: 'asc' },
          },
        },
      },
      Course: {
        select: {
          id: true,
          code: true,
          name_vi: true,
          credits: true,
          theory_credit: true,
          practical_credit: true,
          prerequisites: {
            select: {
              prerequisite_type: true,
              prerequisite_course: {
                select: {
                  id: true,
                  code: true,
                  name_vi: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { display_order: 'asc' },
  },
  _count: {
    select: {
      StudentAcademicProgress: true,
      ProgramCourseMap: true,
    },
  },
} as const;

