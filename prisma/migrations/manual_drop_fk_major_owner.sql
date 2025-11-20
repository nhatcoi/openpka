-- Migration: Drop foreign key constraint fk_major_owner
-- Run this with: psql -h 103.252.136.113 -p 5434 -U postgres -d training_system -f prisma/migrations/manual_drop_fk_major_owner.sql

BEGIN;

-- Drop foreign key constraint if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_major_owner' 
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'academic')
    ) THEN
        ALTER TABLE academic.majors DROP CONSTRAINT fk_major_owner;
    END IF;
END $$;

COMMIT;

