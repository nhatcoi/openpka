-- Add `default_quota` column to academic.majors if it doesn’t exist
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'academic'
        AND table_name   = 'majors'
        AND column_name  = 'default_title'
    ) THEN
    ALTER TABLE academic.majors
        ADD COLUMN default_quota integer;
    END IF;
END $$;

COMMIT;