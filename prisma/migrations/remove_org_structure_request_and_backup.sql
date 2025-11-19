-- Remove org_structure_request and org_unit_backups tables

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS org.org_units 
  DROP CONSTRAINT IF EXISTS org_units_owner_org_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS org.idx_org_structure_request_attachments;
DROP INDEX IF EXISTS org.idx_org_structure_request_owner;
DROP INDEX IF EXISTS org.idx_org_structure_request_requester;

-- Drop tables
DROP TABLE IF EXISTS org.org_structure_request CASCADE;
DROP TABLE IF EXISTS org.org_unit_backups CASCADE;

