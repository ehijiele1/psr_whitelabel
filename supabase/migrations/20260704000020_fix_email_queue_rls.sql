-- Fix email_queue RLS: restrict to service_role only
-- Previously any authenticated user could SELECT/UPDATE all queued emails (PII leak)
-- All code inserts via createAdminClient() (service_role), which bypasses RLS

DROP POLICY IF EXISTS email_queue_insert ON email_queue;
DROP POLICY IF EXISTS email_queue_select ON email_queue;
DROP POLICY IF EXISTS email_queue_update ON email_queue;

CREATE POLICY email_queue_insert ON email_queue FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY email_queue_select ON email_queue FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY email_queue_update ON email_queue FOR UPDATE
  USING (auth.role() = 'service_role');
