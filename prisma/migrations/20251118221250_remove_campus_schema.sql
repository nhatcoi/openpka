-- Migration: Remove Campus model and campus_id from OrgUnit
-- Date: 2025-01-XX
-- Description: Drop campuses table in public schema and remove campus_id foreign key from org_units

BEGIN;

-- Step 1: Drop foreign key constraint from org_units table
ALTER TABLE IF EXISTS org.org_units 
    DROP CONSTRAINT IF EXISTS org_units_campus_id_fkey;

-- Step 2: Drop index for campus_id
DROP INDEX IF EXISTS org.idx_org_units_campus_id;

-- Step 3: Drop campus_id column from org_units table
ALTER TABLE IF EXISTS org.org_units 
    DROP COLUMN IF EXISTS campus_id;

-- Step 4: Drop campuses table in public schema
DROP TABLE IF EXISTS public.campuses CASCADE;

COMMIT;

-- Verify migration completed
SELECT 
    table_schema,
    table_name,
    column_name
FROM 
    information_schema.columns 
WHERE 
    (table_schema = 'public' AND table_name = 'campuses')
    OR (table_schema = 'org' AND table_name = 'org_units' AND column_name = 'campus_id')
ORDER BY 
    table_schema, table_name, column_name;

