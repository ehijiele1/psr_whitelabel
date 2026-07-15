-- PrinceSteve Residence Migration 17: Create email_queue table
-- email.ts inserts into email_queue (to_address, subject, html_body,
-- text_body, status, retry_count). The enhanced_schema migration only
-- added RLS policies for this table but forgot the CREATE TABLE, so the
-- table never existed. Create it here (idempotent).

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_address text NOT NULL,
  subject text NOT NULL,
  html_body text,
  text_body text,
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT check_email_queue_status CHECK (status IN ('pending','sent','failed')),
  retry_count integer NOT NULL DEFAULT 0,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_queue_insert ON email_queue;
CREATE POLICY email_queue_insert ON email_queue FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS email_queue_select ON email_queue;
CREATE POLICY email_queue_select ON email_queue FOR SELECT USING (true);

DROP POLICY IF EXISTS email_queue_update ON email_queue;
CREATE POLICY email_queue_update ON email_queue FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at DESC);
