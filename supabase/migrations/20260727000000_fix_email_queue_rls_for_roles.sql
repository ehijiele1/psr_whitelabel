-- Fix email_queue RLS: allow landlord and caretaker roles to insert
-- Previously only service_role could insert, but now we use regular clients
-- for email operations with proper ownership tracking

-- Add created_by column for ownership tracking
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS created_by uuid;

DROP POLICY IF EXISTS email_queue_insert ON email_queue;
DROP POLICY IF EXISTS email_queue_select ON email_queue;
DROP POLICY IF EXISTS email_queue_update ON email_queue;

-- Allow service_role (for admin operations) and authenticated users with roles to insert
CREATE POLICY email_queue_insert ON email_queue FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    get_my_role() IN ('landlord', 'caretaker')
  );

-- Allow service_role to select all, and users to select their own emails
CREATE POLICY email_queue_select ON email_queue FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    created_by = auth.uid()
  );

-- Allow service_role to update all, and users to update their own emails
CREATE POLICY email_queue_update ON email_queue FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    created_by = auth.uid()
  );
