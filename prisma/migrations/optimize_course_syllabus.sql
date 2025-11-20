-- Migration: Optimize course_syllabus by consolidating fields into JSONB
-- This migration:
-- 1. Adds syllabus_data JSONB column
-- 2. Migrates existing data from individual columns to JSONB
-- 3. Drops old columns and indexes
-- 4. Drops unique constraint on (course_version_id, week_number)

-- Step 1: Add syllabus_data column
ALTER TABLE academic.course_syllabus 
ADD COLUMN IF NOT EXISTS syllabus_data JSONB;

-- Step 2: Migrate existing data to JSONB format
-- Group by course_version_id and aggregate all weeks into a single JSONB array
-- First, create a temporary table to aggregate weeks by version
WITH aggregated_weeks AS (
  SELECT 
    course_version_id,
    jsonb_agg(
      jsonb_build_object(
        'week_number', week_number,
        'topic', topic,
        'teaching_methods', COALESCE(teaching_methods, NULL),
        'materials', COALESCE(materials, NULL),
        'assignments', COALESCE(assignments, NULL),
        'duration_hours', COALESCE(duration_hours::numeric::text, '3.0'),
        'is_exam_week', COALESCE(is_exam_week, false)
      ) ORDER BY week_number
    ) AS weeks_data
  FROM academic.course_syllabus
  GROUP BY course_version_id
)
-- Update each version with its aggregated weeks
UPDATE academic.course_syllabus cs
SET syllabus_data = aw.weeks_data
FROM aggregated_weeks aw
WHERE cs.course_version_id = aw.course_version_id
  AND cs.id = (
    SELECT MIN(id) 
    FROM academic.course_syllabus 
    WHERE course_version_id = cs.course_version_id
  );

-- Delete duplicate rows (keep only one row per version with syllabus_data)
DELETE FROM academic.course_syllabus cs1
WHERE cs1.id IN (
  SELECT cs2.id
  FROM academic.course_syllabus cs2
  WHERE cs2.course_version_id = cs1.course_version_id
    AND cs2.id > (
      SELECT MIN(id)
      FROM academic.course_syllabus
      WHERE course_version_id = cs2.course_version_id
    )
);

-- Step 3: Drop unique constraint and indexes
DROP INDEX IF EXISTS academic.idx_course_syllabus_exam_week;
DROP INDEX IF EXISTS academic.idx_course_syllabus_week_number;
ALTER TABLE academic.course_syllabus 
DROP CONSTRAINT IF EXISTS uq_course_version_week;

-- Step 4: Drop old columns
ALTER TABLE academic.course_syllabus 
DROP COLUMN IF EXISTS week_number,
DROP COLUMN IF EXISTS topic,
DROP COLUMN IF EXISTS teaching_methods,
DROP COLUMN IF EXISTS materials,
DROP COLUMN IF EXISTS assignments,
DROP COLUMN IF EXISTS duration_hours,
DROP COLUMN IF EXISTS is_exam_week;

-- Step 5: Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_course_syllabus_data 
ON academic.course_syllabus USING GIN (syllabus_data);

