-- Remove check constraint for org_units.status
-- This allows more flexibility in status management and enables dynamic status configuration

ALTER TABLE org.org_units 
DROP CONSTRAINT IF EXISTS org_units_status_check_new;

COMMENT ON TABLE org.org_units IS 'Organization units table. Status is managed dynamically through org_unit_statuses table.';

