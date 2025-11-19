-- Script để đồng bộ org_unit_relation từ org_units.parent_id
-- Tạo các relation 'direct' cho tất cả các org_units có parent_id

BEGIN;

-- Kiểm tra và insert các relation còn thiếu
INSERT INTO org.org_unit_relation (
  parent_id,
  child_id,
  relation_type,
  effective_from,
  effective_to,
  note,
  created_at,
  updated_at
)
SELECT 
  ou.parent_id,
  ou.id as child_id,
  'direct'::org_relation_type as relation_type,
  COALESCE(ou.effective_from, CURRENT_DATE) as effective_from,
  ou.effective_to,
  'Tự động đồng bộ từ org_units.parent_id' as note,
  NOW() as created_at,
  NOW() as updated_at
FROM org.org_units ou
WHERE ou.parent_id IS NOT NULL
  -- Chỉ insert nếu chưa có relation direct active với cùng parent_id
  AND NOT EXISTS (
    SELECT 1
    FROM org.org_unit_relation our
    WHERE our.child_id = ou.id
      AND our.parent_id = ou.parent_id
      AND our.relation_type = 'direct'
      AND our.effective_from = COALESCE(ou.effective_from, CURRENT_DATE)
  )
ON CONFLICT (parent_id, child_id, relation_type, effective_from) 
DO NOTHING;

-- Đếm số lượng đã insert
SELECT COUNT(*) as inserted_count
FROM org.org_unit_relation
WHERE note = 'Tự động đồng bộ từ org_units.parent_id';

COMMIT;

