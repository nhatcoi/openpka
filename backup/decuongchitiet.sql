-- -------------------------------------------------------------
-- TablePlus 6.7.0(634)
--
-- https://tableplus.com/
--
-- Database: training_system
-- Generation Time: 2025-11-21 09:23:24.6550
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "academic"."course_syllabus";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS academic.course_syllabus_id_seq;

-- Table Definition
CREATE TABLE "academic"."course_syllabus" (
    "id" int8 NOT NULL DEFAULT nextval('academic.course_syllabus_id_seq'::regclass),
    "course_version_id" int8 NOT NULL,
    "version_no" int4 NOT NULL DEFAULT 1,
    "status" varchar(20) NOT NULL DEFAULT 'draft'::character varying,
    "language" varchar(10) NOT NULL DEFAULT 'vi'::character varying,
    "effective_from" date,
    "effective_to" date,
    "is_current" bool NOT NULL DEFAULT false,
    "basic_info" jsonb,
    "learning_outcomes" jsonb,
    "weekly_plan" jsonb,
    "assessment_plan" jsonb,
    "teaching_methods" jsonb,
    "materials" jsonb,
    "policies" jsonb,
    "rubrics" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "created_by" int8,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "updated_by" int8,
    PRIMARY KEY ("id")
);

INSERT INTO "academic"."course_syllabus" ("id", "course_version_id", "version_no", "status", "language", "effective_from", "effective_to", "is_current", "basic_info", "learning_outcomes", "weekly_plan", "assessment_plan", "teaching_methods", "materials", "policies", "rubrics", "created_at", "created_by", "updated_at", "updated_by") VALUES
(3, 80, 1, 'approved', 'vi', '2025-11-21', NULL, 't', '{"objectives": "Cung cấp kiến thức nền tảng và kỹ năng thực hành liên quan đến học phần.", "course_type": "Bắt buộc", "description": "Học phần giới thiệu các khái niệm cơ bản và các ứng dụng thực tiễn.", "total_hours": 100, "total_weeks": 10, "prerequisites": "Không yêu cầu học phần tiên quyết", "classification": "Chuyên ngành", "credit_distribution": "3"}', '{"clo": [{"id": "clo-1763675537299", "code": "CLO1", "description": "Trình bày được các khái niệm cơ bản liên quan đến học phần.", "plo_mapping": []}, {"id": "clo-1763675554536", "code": "CLO2", "description": "Vận dụng được kiến thức để giải quyết các bài toán mẫu.", "plo_mapping": []}]}', '[{"topic": "Giới thiệu học phần và tổng quan nội dung", "materials": "Giáo trình, slide bài giảng", "objectives": "Hiểu mục tiêu, kế hoạch và cấu trúc học phần", "week_number": 1, "is_exam_week": false, "duration_hours": 3, "is_midterm_week": false, "teaching_methods": "Thuyết trình, thảo luận", "materials_documents": ["5"]}]', '{"components": [{"name": "Bài tập", "type": "assignment", "weight": 20, "criteria": "Đánh giá mức độ hoàn thành yêu cầu bài tập", "description": "Bài tập định kỳ"}, {"name": "Thi cuối kỳ", "type": "final_exam", "weight": 80, "criteria": "Đánh giá tổng hợp toàn bộ kiến thức", "description": "Thi viết"}], "total_weight": 100}', '{"methods": [{"method": "Thảo luận nhóm", "duration": "2", "frequency": "1 buổi/tuần", "description": "Thảo luận để mở rộng và áp dụng nội dung bài học"}]}', NULL, '{"attendance": "Sinh viên cần tham dự tối thiểu 80% số buổi học.", "communication": {"office_hours": "Thứ 2 - Thứ 6", "lecturer_email": "giangvien@example.com"}, "late_submission": "Bài nộp muộn bị trừ 10% mỗi ngày.", "academic_integrity": "Sinh viên phải tuân thủ các quy định về trung thực học thuật."}', '{"components": [{"code": "qêqw", "name": "Chương trình Ngành Hệ thống thông tin123", "criteria": []}]}', '2025-11-20 21:51:35.825+00', 1, '2025-11-20 22:02:55.824+00', 1),
(9, 83, 1, 'approved', 'vi', '2025-11-21', NULL, 't', '{"objectives": "S", "course_type": "s", "description": "CSSS", "total_hours": 2, "total_weeks": 2, "prerequisites": "s", "classification": "s", "credit_distribution": "2"}', '{"clo": [{"id": "clo-1763678611470", "code": "CLO1", "description": "223", "plo_mapping": []}]}', '[{"notes": "13241", "topic": "123", "materials": "3124", "objectives": "312", "assignments": "12412", "week_number": 1, "is_exam_week": false, "duration_hours": 3, "is_midterm_week": true, "teaching_methods": "3123", "materials_documents": ["6"]}]', '{"components": [{"name": "124", "type": "quiz", "weight": 20, "criteria": "42", "description": "42"}, {"name": "1244", "type": "assignment", "weight": 80, "criteria": "421", "description": "412"}], "total_weight": 100}', '{"methods": [{"method": "Thuyết trình", "duration": "3", "frequency": "12", "description": "412124"}, {"method": "Case study", "duration": "123", "frequency": "412", "description": "12312"}], "description": "1124123123ắdawdaw"}', NULL, '{"attendance": "213", "communication": {"office_hours": "123", "lecturer_email": "nhatcoi1206@gmail.com"}, "late_submission": "23", "academic_integrity": "123"}', '{"components": [{"code": "213", "name": "213", "criteria": []}]}', '2025-11-20 22:45:50.668+00', 1, '2025-11-20 22:45:50.668+00', 1);

ALTER TABLE "academic"."course_syllabus" ADD FOREIGN KEY ("course_version_id") REFERENCES "academic"."course_versions"("id") ON DELETE CASCADE;


-- Indices
CREATE UNIQUE INDEX course_syllabus_new_pkey ON academic.course_syllabus USING btree (id);
CREATE INDEX idx_course_syllabus_course_version_id ON academic.course_syllabus USING btree (course_version_id);
CREATE INDEX idx_course_syllabus_status ON academic.course_syllabus USING btree (status);
CREATE INDEX idx_course_syllabus_is_current ON academic.course_syllabus USING btree (is_current);
CREATE INDEX idx_course_syllabus_course_version_status ON academic.course_syllabus USING btree (course_version_id, status);
CREATE INDEX idx_course_syllabus_effective_dates ON academic.course_syllabus USING btree (effective_from, effective_to);
