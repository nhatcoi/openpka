-- Change CourseSyllabus id from UUID to BigInt
-- Change created_by and updated_by from UUID to BigInt

BEGIN;

-- Drop existing indexes that reference id
DROP INDEX IF EXISTS academic.idx_course_syllabus_course_version_id;
DROP INDEX IF EXISTS academic.idx_course_syllabus_status;
DROP INDEX IF EXISTS academic.idx_course_syllabus_is_current;
DROP INDEX IF EXISTS academic.idx_course_syllabus_course_version_status;
DROP INDEX IF EXISTS academic.idx_course_syllabus_effective_dates;

-- Create a new temporary table with BigInt id
CREATE TABLE academic.course_syllabus_new (
  id                BIGSERIAL PRIMARY KEY,
  course_version_id BIGINT NOT NULL,
  version_no        INTEGER NOT NULL DEFAULT 1,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  language          VARCHAR(10) NOT NULL DEFAULT 'vi',
  effective_from    DATE,
  effective_to      DATE,
  is_current        BOOLEAN NOT NULL DEFAULT false,
  basic_info        JSONB,
  learning_outcomes  JSONB,
  weekly_plan       JSONB,
  assessment_plan   JSONB,
  teaching_methods  JSONB,
  materials         JSONB,
  policies          JSONB,
  rubrics           JSONB,
  created_at        TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  created_by        BIGINT,
  updated_at        TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_by        BIGINT,
  CONSTRAINT fk_course_syllabus_course_version 
    FOREIGN KEY (course_version_id) 
    REFERENCES academic.course_versions(id) 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION
);

-- Copy data from old table to new table (if any exists)
-- Note: UUID ids will be converted to sequential BigInt ids
INSERT INTO academic.course_syllabus_new (
  course_version_id, version_no, status, language, 
  effective_from, effective_to, is_current,
  basic_info, learning_outcomes, weekly_plan, assessment_plan,
  teaching_methods, materials, policies, rubrics,
  created_at, created_by, updated_at, updated_by
)
SELECT 
  course_version_id, version_no, status, language,
  effective_from, effective_to, is_current,
  basic_info, learning_outcomes, weekly_plan, assessment_plan,
  teaching_methods, materials, policies, rubrics,
  created_at, NULL, updated_at, NULL  -- Set created_by and updated_by to NULL since UUID can't convert to BigInt
FROM academic.course_syllabus;

-- Drop old table
DROP TABLE academic.course_syllabus;

-- Rename new table to original name
ALTER TABLE academic.course_syllabus_new RENAME TO course_syllabus;

-- Recreate indexes
CREATE INDEX idx_course_syllabus_course_version_id ON academic.course_syllabus(course_version_id);
CREATE INDEX idx_course_syllabus_status ON academic.course_syllabus(status);
CREATE INDEX idx_course_syllabus_is_current ON academic.course_syllabus(is_current);
CREATE INDEX idx_course_syllabus_course_version_status ON academic.course_syllabus(course_version_id, status);
CREATE INDEX idx_course_syllabus_effective_dates ON academic.course_syllabus(effective_from, effective_to);

COMMIT;
