-- =============================================================================
-- Migration: 20260519000200_powersync_setup.sql
-- Creates the PowerSync replication role and publication.
--
-- IMPORTANT — BEFORE RUNNING THIS MIGRATION:
-- Replace ${POWERSYNC_ROLE_PASSWORD} with a real strong password.
-- Store the password in your password manager — you will need it when
-- connecting PowerSync to Supabase in the PowerSync dashboard.
-- This placeholder must NOT be committed as a real password.
--
-- Steps:
-- 1. Open this file and replace ${POWERSYNC_ROLE_PASSWORD} with your password.
-- 2. Run: supabase db push
-- 3. Store the password securely — it is separate from the Supabase DB password.
-- =============================================================================

-- Create the PowerSync replication role.
-- REPLICATION: allows reading WAL for sync.
-- LOGIN: allows connecting to the DB.
-- SELECT only: powersync_role has no write access (T-02-E-01 threat mitigation).
CREATE ROLE powersync_role WITH REPLICATION LOGIN PASSWORD '${POWERSYNC_ROLE_PASSWORD}';

-- Grant access to the public schema.
GRANT USAGE ON SCHEMA public TO powersync_role;

-- Grant SELECT on all existing tables.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- Grant SELECT on all future tables created in public schema.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

-- Create the publication for PowerSync WAL streaming.
-- FOR ALL TABLES: publishes changes from every table in the database.
CREATE PUBLICATION powersync FOR ALL TABLES;
