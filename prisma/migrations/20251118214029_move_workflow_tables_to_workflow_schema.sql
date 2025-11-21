-- Migration: Move workflow tables from academic schema to workflow schema
-- Date: 2025-01-XX
-- Description: Transfer all workflow-related tables from academic schema to workflow schema

BEGIN;

-- Step 1: Create tables in workflow schema with same structure as academic schema

-- Create workflow_definitions table
CREATE TABLE IF NOT EXISTS workflow.workflow_definitions (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    workflow_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    auto_approval_threshold INTEGER DEFAULT 7,
    escalation_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS workflow.workflow_steps (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    approver_role VARCHAR(50),
    approver_org_level VARCHAR(50),
    timeout_days INTEGER DEFAULT 3,
    escalation_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT workflow_steps_workflow_id_fkey FOREIGN KEY (workflow_id) 
        REFERENCES workflow.workflow_definitions(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create workflow_instances table
CREATE TABLE IF NOT EXISTS workflow.workflow_instances (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    current_step INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'PENDING',
    initiated_by BIGINT NOT NULL,
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT workflow_instances_workflow_id_fkey FOREIGN KEY (workflow_id) 
        REFERENCES workflow.workflow_definitions(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create indexes for workflow_instances
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity 
    ON workflow.workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_initiated_by 
    ON workflow.workflow_instances(initiated_by);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status 
    ON workflow.workflow_instances(status);

-- Create approval_records table
CREATE TABLE IF NOT EXISTS workflow.approval_records (
    id BIGSERIAL PRIMARY KEY,
    workflow_instance_id BIGINT,
    step_id BIGINT,
    approver_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    comments TEXT,
    attachments JSONB,
    approved_at TIMESTAMP,
    due_date TIMESTAMP,
    is_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT approval_records_step_id_fkey FOREIGN KEY (step_id) 
        REFERENCES workflow.workflow_steps(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT approval_records_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id) 
        REFERENCES workflow.workflow_instances(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create indexes for approval_records
CREATE INDEX IF NOT EXISTS idx_approval_records_approver 
    ON workflow.approval_records(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_workflow 
    ON workflow.approval_records(workflow_instance_id);

-- Step 2: Copy data from academic schema to workflow schema
-- Note: We need to copy in order to maintain foreign key relationships

-- Copy workflow_definitions first (no dependencies)
INSERT INTO workflow.workflow_definitions 
    (id, entity_type, workflow_name, description, is_active, auto_approval_threshold, 
     escalation_enabled, created_at, updated_at)
SELECT 
    id, entity_type, workflow_name, description, is_active, auto_approval_threshold,
    escalation_enabled, created_at, updated_at
FROM academic.workflow_definitions
ON CONFLICT (id) DO NOTHING;

-- Update sequence for workflow_definitions
SELECT setval('workflow.workflow_definitions_id_seq', 
    COALESCE((SELECT MAX(id) FROM workflow.workflow_definitions), 1), true);

-- Copy workflow_steps (depends on workflow_definitions)
INSERT INTO workflow.workflow_steps 
    (id, workflow_id, step_order, step_name, approver_role, approver_org_level, 
     timeout_days, escalation_enabled, created_at)
SELECT 
    id, workflow_id, step_order, step_name, approver_role, approver_org_level,
    timeout_days, escalation_enabled, created_at
FROM academic.workflow_steps
ON CONFLICT (id) DO NOTHING;

-- Update sequence for workflow_steps
SELECT setval('workflow.workflow_steps_id_seq', 
    COALESCE((SELECT MAX(id) FROM workflow.workflow_steps), 1), true);

-- Copy workflow_instances (depends on workflow_definitions)
INSERT INTO workflow.workflow_instances 
    (id, workflow_id, entity_type, entity_id, current_step, status, initiated_by, 
     initiated_at, completed_at, metadata, created_at, updated_at)
SELECT 
    id, workflow_id, entity_type, entity_id, current_step, status, initiated_by,
    initiated_at, completed_at, metadata, created_at, updated_at
FROM academic.workflow_instances
ON CONFLICT (id) DO NOTHING;

-- Update sequence for workflow_instances
SELECT setval('workflow.workflow_instances_id_seq', 
    COALESCE((SELECT MAX(id) FROM workflow.workflow_instances), 1), true);

-- Copy approval_records (depends on workflow_steps and workflow_instances)
INSERT INTO workflow.approval_records 
    (id, workflow_instance_id, step_id, approver_id, action, comments, attachments, 
     approved_at, due_date, is_escalated, created_at)
SELECT 
    id, workflow_instance_id, step_id, approver_id, action, comments, attachments,
    approved_at, due_date, is_escalated, created_at
FROM academic.approval_records
ON CONFLICT (id) DO NOTHING;

-- Update sequence for approval_records
SELECT setval('workflow.approval_records_id_seq', 
    COALESCE((SELECT MAX(id) FROM workflow.approval_records), 1), true);

-- Step 3: Verify data was copied correctly
DO $$
DECLARE
    def_count INTEGER;
    steps_count INTEGER;
    instances_count INTEGER;
    records_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO def_count FROM workflow.workflow_definitions;
    SELECT COUNT(*) INTO steps_count FROM workflow.workflow_steps;
    SELECT COUNT(*) INTO instances_count FROM workflow.workflow_instances;
    SELECT COUNT(*) INTO records_count FROM workflow.approval_records;
    
    RAISE NOTICE 'Copied % workflow_definitions, % workflow_steps, % workflow_instances, % approval_records', 
        def_count, steps_count, instances_count, records_count;
END $$;

-- Step 4: Drop foreign key constraints from academic tables first
ALTER TABLE academic.approval_records 
    DROP CONSTRAINT IF EXISTS approval_records_step_id_fkey;
ALTER TABLE academic.approval_records 
    DROP CONSTRAINT IF EXISTS approval_records_workflow_instance_id_fkey;
ALTER TABLE academic.workflow_steps 
    DROP CONSTRAINT IF EXISTS workflow_steps_workflow_id_fkey;
ALTER TABLE academic.workflow_instances 
    DROP CONSTRAINT IF EXISTS workflow_instances_workflow_id_fkey;

-- Step 5: Drop tables from academic schema
DROP TABLE IF EXISTS academic.approval_records CASCADE;
DROP TABLE IF EXISTS academic.workflow_instances CASCADE;
DROP TABLE IF EXISTS academic.workflow_steps CASCADE;
DROP TABLE IF EXISTS academic.workflow_definitions CASCADE;

COMMIT;

-- Verify migration completed
SELECT 
    table_schema,
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema IN ('workflow', 'academic')
    AND table_name IN ('workflow_definitions', 'workflow_steps', 'workflow_instances', 'approval_records')
ORDER BY 
    table_schema, table_name;

