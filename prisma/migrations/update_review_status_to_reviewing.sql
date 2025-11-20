-- Update all status values from 'REVIEW' to 'REVIEWING' in org.org_units table
-- This ensures consistency in status naming across the system

UPDATE org.org_units 
SET status = 'REVIEWING' 
WHERE status = 'REVIEW';

-- Verify no records with 'REVIEW' status remain
DO $$
DECLARE
    review_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO review_count 
    FROM org.org_units 
    WHERE status = 'REVIEW';
    
    IF review_count > 0 THEN
        RAISE NOTICE 'Warning: % records still have status = ''REVIEW''', review_count;
    ELSE
        RAISE NOTICE 'Success: All ''REVIEW'' statuses have been updated to ''REVIEWING''';
    END IF;
END $$;

COMMENT ON COLUMN org.org_units.status IS 'Organization unit status. Valid values: DRAFT, REVIEWING, APPROVED, ACTIVE, REJECTED, SUSPENDED, INACTIVE, ARCHIVED';

