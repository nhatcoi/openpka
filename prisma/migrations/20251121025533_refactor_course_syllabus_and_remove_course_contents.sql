-- Migration: Refactor course_syllabus and remove course_contents
-- Date: 2024-12-XX
-- Description: 
--   1. Drop course_contents table
--   2. Refactor course_syllabus to use UUID and new structure

BEGIN;

-- Step 1: Drop foreign key constraints and indexes related to course_contents
ALTER TABLE academic.course_contents 
  DROP CONSTRAINT IF EXISTS fk_course_contents_course_id;

DROP INDEX IF EXISTS academic.idx_course_contents_course_id;

-- Step 2: Drop course_contents table
DROP TABLE IF EXISTS academic.course_contents CASCADE;

-- Step 3: Drop old course_syllabus table if exists
DROP TABLE IF EXISTS academic.course_syllabus CASCADE;

-- Step 4: Create new course_syllabus table with UUID and new structure
-- Note: course_version_id is BigInt to match course_versions.id (BigInt)
CREATE TABLE IF NOT EXISTS academic.course_syllabus (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id BIGINT NOT NULL,
  version_no        INT NOT NULL DEFAULT 1,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  language          VARCHAR(10) NOT NULL DEFAULT 'vi',
  effective_from    DATE,
  effective_to      DATE,
  is_current        BOOLEAN NOT NULL DEFAULT false,
  basic_info        JSONB,
  learning_outcomes JSONB,
  weekly_plan       JSONB,
  assessment_plan  JSONB,
  teaching_methods  JSONB,
  materials         JSONB,
  policies          JSONB,
  rubrics           JSONB,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by        UUID,
  
  -- Foreign key constraint
  CONSTRAINT fk_course_syllabus_course_version FOREIGN KEY (course_version_id) 
    REFERENCES academic.course_versions(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_syllabus_status CHECK (status IN ('draft', 'approved', 'archived')),
  CONSTRAINT chk_syllabus_language CHECK (language IN ('vi', 'en', 'vi-en')),
  CONSTRAINT chk_syllabus_version_positive CHECK (version_no > 0),
  CONSTRAINT chk_syllabus_effective_dates CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

-- Step 5: Create indexes
CREATE INDEX idx_course_syllabus_course_version_id ON academic.course_syllabus(course_version_id);
CREATE INDEX idx_course_syllabus_status ON academic.course_syllabus(status);
CREATE INDEX idx_course_syllabus_is_current ON academic.course_syllabus(is_current);
CREATE INDEX idx_course_syllabus_course_version_status ON academic.course_syllabus(course_version_id, status);
CREATE INDEX idx_course_syllabus_effective_dates ON academic.course_syllabus(effective_from, effective_to);

-- Step 6: Create GIN indexes for JSONB columns for better query performance
CREATE INDEX idx_course_syllabus_basic_info ON academic.course_syllabus USING GIN (basic_info);
CREATE INDEX idx_course_syllabus_learning_outcomes ON academic.course_syllabus USING GIN (learning_outcomes);
CREATE INDEX idx_course_syllabus_weekly_plan ON academic.course_syllabus USING GIN (weekly_plan);
CREATE INDEX idx_course_syllabus_assessment_plan ON academic.course_syllabus USING GIN (assessment_plan);

-- Step 7: Add comments
COMMENT ON TABLE academic.course_syllabus IS 'Đề cương chi tiết cho học phần';
COMMENT ON COLUMN academic.course_syllabus.course_version_id IS 'ID phiên bản học phần';
COMMENT ON COLUMN academic.course_syllabus.version_no IS 'Số phiên bản (v1, v2, ...)';
COMMENT ON COLUMN academic.course_syllabus.status IS 'Trạng thái: draft, approved, archived';
COMMENT ON COLUMN academic.course_syllabus.language IS 'Ngôn ngữ: vi, en, vi-en';
COMMENT ON COLUMN academic.course_syllabus.is_current IS 'Đề cương đang được sử dụng';
COMMENT ON COLUMN academic.course_syllabus.basic_info IS 'Thông tin cơ bản: mô tả, phân loại, điều kiện';
COMMENT ON COLUMN academic.course_syllabus.learning_outcomes IS 'Kết quả học tập: CLO + mapping PLO';
COMMENT ON COLUMN academic.course_syllabus.weekly_plan IS 'Kế hoạch theo tuần/chương';
COMMENT ON COLUMN academic.course_syllabus.assessment_plan IS 'Kế hoạch đánh giá: các thành phần điểm, trọng số';
COMMENT ON COLUMN academic.course_syllabus.teaching_methods IS 'Phương pháp dạy - học';
COMMENT ON COLUMN academic.course_syllabus.materials IS 'Giáo trình, tài liệu tham khảo';
COMMENT ON COLUMN academic.course_syllabus.policies IS 'Quy định lớp, điều kiện qua môn';
COMMENT ON COLUMN academic.course_syllabus.rubrics IS 'Tiêu chí chấm điểm (nếu có)';

-- Note: course_version_id references course_versions.id (BigInt)

COMMIT;

