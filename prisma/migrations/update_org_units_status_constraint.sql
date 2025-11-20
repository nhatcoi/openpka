-- Update check constraint for org_units.status to include REVIEWING and SUSPENDED statuses
-- This allows the workflow actions to work correctly

ALTER TABLE org.org_units 
DROP CONSTRAINT IF EXISTS org_units_status_check_new;

ALTER TABLE org.org_units 
ADD CONSTRAINT org_units_status_check_new 
CHECK (
  (status IS NULL) OR 
  (status::text = ANY (
    ARRAY[
      'DRAFT'::character varying,
      'REVIEWING'::character varying,
      'REVIEW'::character varying,
      'APPROVED'::character varying,
      'ACTIVE'::character varying,
      'INACTIVE'::character varying,
      'ARCHIVED'::character varying,
      'REJECTED'::character varying,
      'SUSPENDED'::character varying,
      'DELETED'::character varying
    ]::text[]
  ))
);

COMMENT ON CONSTRAINT org_units_status_check_new ON org.org_units IS 'Check constraint to ensure status values are valid. Includes workflow statuses: DRAFT, REVIEWING, APPROVED, ACTIVE, REJECTED, SUSPENDED, INACTIVE, ARCHIVED, DELETED';

