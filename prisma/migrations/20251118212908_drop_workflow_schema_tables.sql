-- Migration: Drop all tables in workflow schema
-- Date: 2025-01-XX
-- Description: Remove all tables from workflow schema (not workflow tables in academic schema)

-- Drop all tables in workflow schema with CASCADE to handle dependencies
DROP TABLE IF EXISTS workflow.approval_records CASCADE;
DROP TABLE IF EXISTS workflow.workflow_definitions CASCADE;
DROP TABLE IF EXISTS workflow.workflow_history CASCADE;
DROP TABLE IF EXISTS workflow.workflow_instances CASCADE;
DROP TABLE IF EXISTS workflow.workflow_steps CASCADE;

-- Optional: Drop the schema itself if it's empty (uncomment if needed)
-- DROP SCHEMA IF EXISTS workflow CASCADE;

-- Verify tables are dropped
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'workflow'
ORDER BY 
    table_name;

