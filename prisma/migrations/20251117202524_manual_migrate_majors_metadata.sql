-- Migration: Remove unused fields and add metadata JSONB to majors table
-- Run this with: psql -h 103.252.136.113 -p 5434 -U postgres -d training_system -f prisma/migrations/manual_migrate_majors_metadata.sql

BEGIN;

-- Step 1: Add metadata column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE academic.majors ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Step 2: Migrate existing data to metadata (only if columns exist)
DO $$ 
BEGIN
    -- Check and migrate field_cluster
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'field_cluster'
    ) THEN
        UPDATE academic.majors
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('field_cluster', field_cluster)
        WHERE field_cluster IS NOT NULL;
    END IF;

    -- Check and migrate established_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'established_at'
    ) THEN
        UPDATE academic.majors
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('established_at', established_at::text)
        WHERE established_at IS NOT NULL;
    END IF;

    -- Check and migrate description
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'description'
    ) THEN
        UPDATE academic.majors
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('description', description)
        WHERE description IS NOT NULL;
    END IF;
END $$;

-- Step 3: Drop columns (only if they exist)
DO $$ 
BEGIN
    -- Drop is_moet_standard
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'is_moet_standard'
    ) THEN
        ALTER TABLE academic.majors DROP COLUMN is_moet_standard;
    END IF;

    -- Drop start_terms
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'start_terms'
    ) THEN
        ALTER TABLE academic.majors DROP COLUMN start_terms;
    END IF;

    -- Drop field_cluster
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'field_cluster'
    ) THEN
        ALTER TABLE academic.majors DROP COLUMN field_cluster;
    END IF;

    -- Drop established_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'established_at'
    ) THEN
        ALTER TABLE academic.majors DROP COLUMN established_at;
    END IF;

    -- Drop description
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'majors' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE academic.majors DROP COLUMN description;
    END IF;
END $$;

COMMIT;

