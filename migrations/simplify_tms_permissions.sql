-- Migration: Simplify TMS Permissions
-- Date: 2024
-- Description: Đơn giản hóa TMS permissions từ 34 xuống 11 permissions
--              Gộp create/update/delete thành write
--              Gộp review/approve/reject/publish thành approve
--              Đổi view thành read
--              Xóa tms.academic.* permissions

BEGIN;

-- 1. Tạo permissions mới (nếu chưa tồn tại)
INSERT INTO auth.permissions (name, description, resource, action, created_at, updated_at)
VALUES
    -- Course permissions (3)
    ('tms.course.read', 'Xem danh sách và chi tiết học phần', 'tms.course', 'read', NOW(), NOW()),
    ('tms.course.write', 'Tạo, sửa, xóa học phần', 'tms.course', 'write', NOW(), NOW()),
    ('tms.course.approve', 'Phê duyệt học phần (review/approve/reject/publish)', 'tms.course', 'approve', NOW(), NOW()),
    
    -- Program permissions (3)
    ('tms.program.read', 'Xem danh sách và chi tiết chương trình', 'tms.program', 'read', NOW(), NOW()),
    ('tms.program.write', 'Tạo, sửa, xóa chương trình', 'tms.program', 'write', NOW(), NOW()),
    ('tms.program.approve', 'Phê duyệt chương trình (review/approve/reject/publish)', 'tms.program', 'approve', NOW(), NOW()),
    
    -- Major permissions (3)
    ('tms.major.read', 'Xem danh sách và chi tiết ngành', 'tms.major', 'read', NOW(), NOW()),
    ('tms.major.write', 'Tạo, sửa, xóa ngành', 'tms.major', 'write', NOW(), NOW()),
    ('tms.major.approve', 'Phê duyệt ngành (review/approve/reject/publish)', 'tms.major', 'approve', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Gán permissions cho role academic_office
-- Academic Office: read + approve (không có write)
INSERT INTO auth.role_permission (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.name = 'academic_office'
AND p.name IN (
    'tms.course.read',
    'tms.course.approve',
    'tms.program.read',
    'tms.program.approve',
    'tms.major.read',
    'tms.major.approve',
    'tms.syllabus.manage',
    'tms.instructor.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Gán permissions cho role academic_board
-- Academic Board: read + approve (không có write)
INSERT INTO auth.role_permission (role_id, permission_id, granted_at)
SELECT r.id, p.id, NOW()
FROM auth.roles r
CROSS JOIN auth.permissions p
WHERE r.name = 'academic_board'
AND p.name IN (
    'tms.course.read',
    'tms.course.approve',
    'tms.program.read',
    'tms.program.approve',
    'tms.major.read',
    'tms.major.approve',
    'tms.syllabus.manage',
    'tms.instructor.manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. (Optional) Xóa permissions cũ nếu muốn
-- Lưu ý: Chỉ xóa nếu chắc chắn không còn sử dụng
-- Uncomment các dòng dưới nếu muốn xóa permissions cũ:

/*
-- Xóa tms.academic.* permissions
DELETE FROM auth.role_permission
WHERE permission_id IN (
    SELECT id FROM auth.permissions
    WHERE name LIKE 'tms.academic.%'
);

DELETE FROM auth.permissions
WHERE name LIKE 'tms.academic.%';

-- Xóa các permissions cũ khác (nếu muốn)
-- Lưu ý: Cần kiểm tra kỹ trước khi xóa
*/

COMMIT;

-- Verification queries (chạy sau khi migration)
-- SELECT r.name, p.name, p.description
-- FROM auth.roles r
-- JOIN auth.role_permission rp ON r.id = rp.role_id
-- JOIN auth.permissions p ON rp.permission_id = p.id
-- WHERE r.name IN ('academic_office', 'academic_board')
-- AND p.name LIKE 'tms.%'
-- ORDER BY r.name, p.name;

