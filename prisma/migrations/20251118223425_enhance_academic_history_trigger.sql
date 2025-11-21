-- Migration: Enhance academic_history trigger to fill all fields
-- Date: 2025-01-XX
-- Description: Update log_academic_history() function to capture all fields including field_name, old_value, new_value, actor info, etc.

BEGIN;

-- Drop existing trigger function and recreate with enhanced logic
DROP FUNCTION IF EXISTS academic.log_academic_history() CASCADE;

-- Create enhanced trigger function
CREATE OR REPLACE FUNCTION academic.log_academic_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    entity_type_value TEXT;
    entity_id_value BIGINT;
    action_value TEXT;
    field_name_value TEXT;
    old_value_value TEXT;
    new_value_value TEXT;
    change_summary_value TEXT;
    actor_id_value BIGINT;
    actor_name_value TEXT;
    user_agent_value TEXT;
    request_id_value TEXT;
    metadata_value JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_record RECORD;
    old_json JSONB;
    new_json JSONB;
    actor_record RECORD;
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

    -- Get session variables for actor info and request context
    -- These should be set from application code using: SELECT set_config('app.actor_id', '123', false);
    BEGIN
        actor_id_value := NULLIF(current_setting('app.actor_id', true), '')::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        actor_id_value := NULL;
    END;

    BEGIN
        actor_name_value := NULLIF(current_setting('app.actor_name', true), '');
    EXCEPTION WHEN OTHERS THEN
        actor_name_value := NULL;
    END;

    BEGIN
        user_agent_value := NULLIF(current_setting('app.user_agent', true), '');
    EXCEPTION WHEN OTHERS THEN
        user_agent_value := NULL;
    END;

    BEGIN
        request_id_value := NULLIF(current_setting('app.request_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        request_id_value := NULL;
    END;

    BEGIN
        metadata_value := NULLIF(current_setting('app.metadata', true), '')::JSONB;
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
    END;

    -- For UPDATE, compare OLD and NEW to find changed fields
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
                
                -- For the first changed field, set field_name, old_value, new_value
                IF array_length(changed_fields, 1) = 1 THEN
                    field_name_value := field_record.column_name;
                    old_value_value := COALESCE(old_json->>field_record.column_name, 'NULL');
                    new_value_value := COALESCE(new_json->>field_record.column_name, 'NULL');
                END IF;
            END IF;
        END LOOP;

        -- Build change summary
        IF array_length(changed_fields, 1) > 0 THEN
            IF array_length(changed_fields, 1) = 1 THEN
                change_summary_value := entity_type_value || ' ' || LOWER(action_value) || ': ' || field_name_value || ' changed';
            ELSE
                change_summary_value := entity_type_value || ' ' || LOWER(action_value) || ': ' || 
                    array_length(changed_fields, 1)::TEXT || ' fields changed (' || 
                    array_to_string(changed_fields[1:3], ', ') || 
                    CASE WHEN array_length(changed_fields, 1) > 3 THEN '...' ELSE '' END || ')';
            END IF;

            -- Build metadata with all changed fields
            IF metadata_value IS NULL THEN
                metadata_value := jsonb_build_object('changed_fields', changed_fields);
            ELSE
                metadata_value := metadata_value || jsonb_build_object('changed_fields', changed_fields);
            END IF;
        ELSE
            change_summary_value := entity_type_value || ' ' || LOWER(action_value) || ' (no changes detected)';
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        change_summary_value := entity_type_value || ' created';
        field_name_value := NULL;
        old_value_value := NULL;
        new_value_value := NULL;
    ELSIF TG_OP = 'DELETE' THEN
        change_summary_value := entity_type_value || ' deleted';
        field_name_value := NULL;
        old_value_value := NULL;
        new_value_value := NULL;
    END IF;

    -- Insert history record with all fields
    INSERT INTO academic.academic_history (
        entity_type,
        entity_id,
        action,
        field_name,
        old_value,
        new_value,
        change_summary,
        actor_id,
        actor_name,
        user_agent,
        request_id,
        metadata,
        created_at
    ) VALUES (
        entity_type_value,
        entity_id_value,
        action_value,
        field_name_value,
        old_value_value,
        new_value_value,
        change_summary_value,
        actor_id_value,
        actor_name_value,
        user_agent_value,
        request_id_value,
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

