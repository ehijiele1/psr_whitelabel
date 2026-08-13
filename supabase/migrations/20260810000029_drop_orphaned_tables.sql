-- Migration: Drop orphaned tables and add push_enabled preference
-- Drops applicants, user_pins, pin_versions (all unused by application code)
-- Adds push_enabled to notification_preferences (used by /api/push/send)

-- 1. Drop orphaned FK references and columns on files
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_applicant_id_fkey;
DROP POLICY IF EXISTS files_applicant_insert ON files;
DROP INDEX IF EXISTS idx_files_applicant;
ALTER TABLE files DROP COLUMN IF EXISTS applicant_id;

-- 2. Drop orphaned FK references and columns on agreements
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_applicant_id_fkey;
ALTER TABLE agreements DROP COLUMN IF EXISTS applicant_id;

-- 3. Drop the orphaned applicants table and its policies
DROP TABLE IF EXISTS applicants;

-- 4. Drop pin tables (ad-hoc, never referenced by application code)
DROP TABLE IF EXISTS user_pins;
DROP TABLE IF EXISTS pin_versions;

-- 5. Add push_enabled to notification_preferences (default true)
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true;
