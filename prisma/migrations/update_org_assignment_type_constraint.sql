-- Update org_assignment assignment_type check constraint to allow 'support' instead of 'project'
-- The constraint currently allows: admin, academic, project
-- Update to allow: admin, academic, support

ALTER TABLE hr.org_assignment 
DROP CONSTRAINT IF EXISTS org_assignment_assignment_type_check;

ALTER TABLE hr.org_assignment 
ADD CONSTRAINT org_assignment_assignment_type_check 
CHECK (assignment_type IN ('admin', 'academic', 'support'));

COMMENT ON COLUMN hr.org_assignment.assignment_type IS 'Loại phân công: admin (Hành chính), academic (Học thuật), support (Hỗ trợ)';

