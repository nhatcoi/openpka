-- Migration: Create org_unit_history table and trigger function similar to academic_history
-- Date: 2025-01-XX
-- Description: 
--   - Drop old org_unit_history table and create new one with similar structure to academic_history
--   - Create trigger function to log all changes to org.units table
--   - Store change details in JSONB format

BEGIN;

-- Drop existing trigger function if exists
DROP FUNCTION IF EXISTS org.log_org_unit_history() CASCADE;

-- Drop old org_unit_history table if exists
DROP TABLE IF EXISTS org.org_unit_history CASCADE;

-- Create new org_unit_history table similar to academic_history
CREATE TABLE org.org_unit_history (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL DEFAULT 'ORG_UNIT',
  entity_id BIGINT NOT NULL,
  action VARCHAR(20) NOT NULL,
  change_summary TEXT,
  change_details JSONB,
  actor_id BIGINT,
  actor_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_org_unit_history_entity ON org.org_unit_history(entity_type, entity_id);
CREATE INDEX idx_org_unit_history_action ON org.org_unit_history(action);
CREATE INDEX idx_org_unit_history_actor ON org.org_unit_history(actor_id);
CREATE INDEX idx_org_unit_history_created_at ON org.org_unit_history(created_at);
CREATE INDEX idx_org_unit_history_type_action ON org.org_unit_history(entity_type, action);
CREATE INDEX idx_org_unit_history_change_details ON org.org_unit_history USING GIN (change_details);

-- Add comments
COMMENT ON TABLE org.org_unit_history IS 'Stores history of changes to organizational units';
COMMENT ON COLUMN org.org_unit_history.entity_type IS 'Type of entity (always ORG_UNIT for this table)';
COMMENT ON COLUMN org.org_unit_history.entity_id IS 'ID of the org unit that was changed';
COMMENT ON COLUMN org.org_unit_history.action IS 'Action performed: CREATE, UPDATE, or DELETE';
COMMENT ON COLUMN org.org_unit_history.change_summary IS 'Human-readable summary of the changes';
COMMENT ON COLUMN org.org_unit_history.change_details IS 'JSONB object containing detailed change information: fields array, changes object (old/new values), initial_values (for INSERT), deleted_values (for DELETE)';
COMMENT ON COLUMN org.org_unit_history.actor_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN org.org_unit_history.actor_name IS 'Name of the user who performed the action';
COMMENT ON COLUMN org.org_unit_history.user_agent IS 'User agent from the request';
COMMENT ON COLUMN org.org_unit_history.metadata IS 'Additional metadata as JSONB';

-- Create trigger function similar to academic.log_academic_history()
CREATE OR REPLACE FUNCTION org.log_org_unit_history()
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
    -- Entity type is always ORG_UNIT
    entity_type_value := 'ORG_UNIT';

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
    INSERT INTO org.org_unit_history (
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

-- Create trigger on org.org_units table
DROP TRIGGER IF EXISTS org_unit_history_trigger ON org.org_units;
CREATE TRIGGER org_unit_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON org.org_units
    FOR EACH ROW
    EXECUTE FUNCTION org.log_org_unit_history();

COMMIT;

