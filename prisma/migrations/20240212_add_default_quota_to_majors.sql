-- Add default_quota column to academic.majors if not present
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'academic'
          AND table_name = 'majors'
          AND column_name = 'default_quota'
    ) THEN
        ALTER TABLE academic.majors
            ADD COLUMN default_quota integer;
    END IF;
END $$;

COMMIT;

