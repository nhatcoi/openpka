-- Migration: Refactor academic_history table structure
-- Date: 2025-01-XX
-- Description: 
--   - Drop field_name, old_value, new_value, request_id columns
--   - Add change_details JSONB column to store all change information
--   - Update trigger function to save all changes in JSONB format

BEGIN;

-- Drop existing trigger function
DROP FUNCTION IF EXISTS academic.log_academic_history() CASCADE;

-- Drop old columns
ALTER TABLE academic.academic_history 
  DROP COLUMN IF EXISTS field_name,
  DROP COLUMN IF EXISTS old_value,
  DROP COLUMN IF EXISTS new_value,
  DROP COLUMN IF EXISTS request_id;

-- Add new change_details JSONB column
ALTER TABLE academic.academic_history 
  ADD COLUMN IF NOT EXISTS change_details JSONB;

-- Create index on change_details for better query performance
CREATE INDEX IF NOT EXISTS idx_academic_history_change_details 
  ON academic.academic_history USING GIN (change_details);

-- Create enhanced trigger function with proper session variable handling
CREATE OR REPLACE FUNCTION academic.log_academic_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    entity_type_value TEXT;
    entity_id_value BIGINT;
    action_value TEXT;
    change_summary_value TEXT;
    actor_id_value BIGINT;
    actor_name_value TEXT;
    user_agent_value TEXT;
    metadata_value JSONB;
    change_details_value JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_record RECORD;
    old_json JSONB;
    new_json JSONB;
    changes_object JSONB := '{}'::JSONB;
    session_actor_id TEXT;
    session_actor_name TEXT;
    session_user_agent TEXT;
    session_metadata TEXT;
BEGIN
    -- Determine entity type from table name
    CASE TG_TABLE_NAME
        WHEN 'majors' THEN entity_type_value := 'MAJOR';
        WHEN 'programs' THEN entity_type_value := 'PROGRAM';
        WHEN 'courses' THEN entity_type_value := 'COURSE';
        WHEN 'program_blocks' THEN entity_type_value := 'PROGRAM_BLOCK';
        WHEN 'program_block_groups' THEN entity_type_value := 'PROGRAM_BLOCK_GROUP';
        WHEN 'program_course_map' THEN entity_type_value := 'PROGRAM_COURSE_MAP';
        WHEN 'course_versions' THEN entity_type_value := 'COURSE_VERSION';
        WHEN 'curriculum_versions' THEN entity_type_value := 'CURRICULUM_VERSION';
        WHEN 'cohorts' THEN entity_type_value := 'COHORT';
        ELSE entity_type_value := UPPER(TG_TABLE_NAME);
    END CASE;

    -- Determine action
    CASE TG_OP
        WHEN 'INSERT' THEN action_value := 'CREATE';
        WHEN 'UPDATE' THEN action_value := 'UPDATE';
        WHEN 'DELETE' THEN action_value := 'DELETE';
    END CASE;

    -- Get entity ID safely
    IF TG_OP = 'DELETE' THEN
        entity_id_value := OLD.id;
    ELSE
        entity_id_value := NEW.id;
    END IF;

    -- Try to get session variables (set from application code)
    -- Note: set_config with 'false' means local to transaction, which is what we want
    BEGIN
        session_actor_id := current_setting('app.actor_id', true);
        IF session_actor_id IS NOT NULL AND session_actor_id != '' THEN
            actor_id_value := session_actor_id::BIGINT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        actor_id_value := NULL;
    END;

    BEGIN
        session_actor_name := current_setting('app.actor_name', true);
        IF session_actor_name IS NOT NULL AND session_actor_name != '' THEN
            actor_name_value := session_actor_name;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        actor_name_value := NULL;
    END;

    BEGIN
        session_user_agent := current_setting('app.user_agent', true);
        IF session_user_agent IS NOT NULL AND session_user_agent != '' THEN
            user_agent_value := session_user_agent;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        user_agent_value := NULL;
    END;

    BEGIN
        session_metadata := current_setting('app.metadata', true);
        IF session_metadata IS NOT NULL AND session_metadata != '' THEN
            metadata_value := session_metadata::JSONB;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        metadata_value := NULL;
    END;

    -- If actor_id is set but actor_name is not, try to get from users table
    IF actor_id_value IS NOT NULL AND actor_name_value IS NULL THEN
        BEGIN
            SELECT full_name INTO actor_name_value
            FROM auth.users
            WHERE id = actor_id_value;
        EXCEPTION WHEN OTHERS THEN
            actor_name_value := NULL;
        END;
    END IF;

    -- Try to get actor from created_by/updated_by if available (fallback)
    IF actor_id_value IS NULL THEN
        IF TG_OP = 'INSERT' AND NEW.created_by IS NOT NULL THEN
            actor_id_value := NEW.created_by;
        ELSIF TG_OP = 'UPDATE' AND NEW.updated_by IS NOT NULL THEN
            actor_id_value := NEW.updated_by;
        END IF;

        -- Try to get actor name
        IF actor_id_value IS NOT NULL AND actor_name_value IS NULL THEN
            BEGIN
                SELECT full_name INTO actor_name_value
                FROM auth.users
                WHERE id = actor_id_value;
            EXCEPTION WHEN OTHERS THEN
                actor_name_value := NULL;
            END;
        END IF;
    END IF;

    -- For UPDATE, compare OLD and NEW to find all changed fields
    IF TG_OP = 'UPDATE' THEN
        -- Convert OLD and NEW to JSONB for comparison
        old_json := to_jsonb(OLD);
        new_json := to_jsonb(NEW);

        -- Compare all columns and collect changes
        FOR field_record IN
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = TG_TABLE_SCHEMA
              AND table_name = TG_TABLE_NAME
              AND column_name NOT IN ('created_at', 'updated_at', 'id') -- Skip these fields
            ORDER BY ordinal_position
        LOOP
            -- Check if field changed
            IF (old_json->>field_record.column_name) IS DISTINCT FROM (new_json->>field_record.column_name) THEN
                changed_fields := array_append(changed_fields, field_record.column_name);
                
                -- Add to changes object
                changes_object := changes_object || jsonb_build_object(
                    field_record.column_name,
                    jsonb_build_object(
                        'old_value', COALESCE(old_json->>field_record.column_name, null),
                        'new_value', COALESCE(new_json->>field_record.column_name, null)
                    )
                );
            END IF;
        END LOOP;

        -- Build change_details JSONB
        -- Check if changes_object has any keys by comparing with empty jsonb
        IF changes_object != '{}'::JSONB AND array_length(changed_fields, 1) > 0 THEN
            change_details_value := jsonb_build_object(
                'fields', changed_fields,
                'changes', changes_object
            );

            -- Build change summary
            IF array_length(changed_fields, 1) = 1 THEN
                change_summary_value := entity_type_value || ' ' || LOWER(action_value) || ': ' || changed_fields[1] || ' changed';
            ELSE
                change_summary_value := entity_type_value || ' ' || LOWER(action_value) || ': ' || 
                    array_length(changed_fields, 1)::TEXT || ' fields changed (' || 
                    array_to_string(changed_fields[1:3], ', ') || 
                    CASE WHEN array_length(changed_fields, 1) > 3 THEN '...' ELSE '' END || ')';
            END IF;
        ELSE
            change_summary_value := entity_type_value || ' ' || LOWER(action_value) || ' (no changes detected)';
            change_details_value := jsonb_build_object('fields', ARRAY[]::TEXT[]);
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        change_summary_value := entity_type_value || ' created';
        -- Store all initial values
        new_json := to_jsonb(NEW);
        change_details_value := jsonb_build_object(
            'fields', ARRAY[]::TEXT[],
            'initial_values', new_json
        );
    ELSIF TG_OP = 'DELETE' THEN
        change_summary_value := entity_type_value || ' deleted';
        -- Store deleted values
        old_json := to_jsonb(OLD);
        change_details_value := jsonb_build_object(
            'fields', ARRAY[]::TEXT[],
            'deleted_values', old_json
        );
    END IF;

    -- Merge metadata into change_details if available
    IF metadata_value IS NOT NULL THEN
        change_details_value := change_details_value || jsonb_build_object('metadata', metadata_value);
    END IF;

    -- Insert history record with all fields
    INSERT INTO academic.academic_history (
        entity_type,
        entity_id,
        action,
        change_summary,
        change_details,
        actor_id,
        actor_name,
        user_agent,
        metadata,
        created_at
    ) VALUES (
        entity_type_value,
        entity_id_value,
        action_value,
        change_summary_value,
        change_details_value,
        actor_id_value,
        actor_name_value,
        user_agent_value,
        metadata_value,
        NOW()
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Recreate triggers on all tables
DROP TRIGGER IF EXISTS program_history_trigger ON academic.programs;
CREATE TRIGGER program_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.programs
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS major_history_trigger ON academic.majors;
CREATE TRIGGER major_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.majors
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS course_history_trigger ON academic.courses;
CREATE TRIGGER course_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.courses
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS program_block_history_trigger ON academic.program_blocks;
CREATE TRIGGER program_block_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.program_blocks
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS program_block_group_history_trigger ON academic.program_block_groups;
CREATE TRIGGER program_block_group_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.program_block_groups
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS program_course_map_history_trigger ON academic.program_course_map;
CREATE TRIGGER program_course_map_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.program_course_map
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS course_version_history_trigger ON academic.course_versions;
CREATE TRIGGER course_version_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.course_versions
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

DROP TRIGGER IF EXISTS curriculum_version_history_trigger ON academic.curriculum_versions;
CREATE TRIGGER curriculum_version_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON academic.curriculum_versions
    FOR EACH ROW
    EXECUTE FUNCTION academic.log_academic_history();

COMMIT;

