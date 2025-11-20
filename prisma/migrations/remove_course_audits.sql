-- Remove course_audits table
-- This table is no longer needed as we use unified_workflow.approval_records for approval history

-- Drop foreign key constraint
ALTER TABLE academic.course_audits 
DROP CONSTRAINT IF EXISTS fk_course_audits_course_id;

-- Drop indexes
DROP INDEX IF EXISTS academic.idx_course_audits_course_id;
DROP INDEX IF EXISTS academic.idx_course_audits_created_by;

-- Drop the table
DROP TABLE IF EXISTS academic.course_audits;

