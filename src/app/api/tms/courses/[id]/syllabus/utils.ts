// Shared utility functions for syllabus API routes

// Helper function to convert userId to BigInt
export const toBigIntUserId = (userId: string | number | undefined): bigint | null => {
  if (!userId) return null;
  return typeof userId === 'string' ? BigInt(userId) : BigInt(userId);
};

// Helper function to serialize syllabus for JSON response
export const serializeSyllabus = (s: any) => ({
  id: s.id.toString(),
  course_version_id: s.course_version_id.toString(),
  version_no: s.version_no,
  status: s.status,
  language: s.language,
  effective_from: s.effective_from,
  effective_to: s.effective_to,
  is_current: s.is_current,
  basic_info: s.basic_info,
  learning_outcomes: s.learning_outcomes,
  weekly_plan: s.weekly_plan,
  assessment_plan: s.assessment_plan,
  teaching_methods: s.teaching_methods,
  materials: s.materials,
  policies: s.policies,
  rubrics: s.rubrics,
  created_at: s.created_at,
  created_by: s.created_by?.toString(),
  updated_at: s.updated_at,
  updated_by: s.updated_by?.toString(),
});

// Helper function to validate course ID
export const validateCourseId = (id: string): number => {
  const courseId = parseInt(id);
  if (isNaN(courseId)) {
    throw new Error('Invalid course ID');
  }
  return courseId;
};

