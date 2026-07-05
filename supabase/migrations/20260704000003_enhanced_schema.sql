-- PrinceSteve Residence Migration 03: Enhanced Schema
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) UNIQUE NOT NULL,
  sms_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  rent_reminders boolean NOT NULL DEFAULT true,
  payment_alerts boolean NOT NULL DEFAULT true,
  ticket_updates boolean NOT NULL DEFAULT true,
  maintenance_alerts boolean NOT NULL DEFAULT true,
  broadcast_messages boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS preferences_self_all ON notification_preferences;
CREATE POLICY preferences_self_all ON notification_preferences FOR ALL USING (user_id = auth.uid());
DROP POLICY IF EXISTS preferences_landlord_select ON notification_preferences;
CREATE POLICY preferences_landlord_select ON notification_preferences FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

CREATE TABLE IF NOT EXISTS agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  applicant_id uuid REFERENCES applicants(id),
  property_id uuid REFERENCES properties(id),
  unsigned_url text, signed_url text, signature_data text, signature_type text,
  signed_at timestamptz, lease_start date, lease_end date,
  rent_amount numeric(15,2), security_deposit numeric(15,2),
  status text DEFAULT 'pending_signature' CONSTRAINT check_agreement_status CHECK (status IN ('pending_signature','signed','active','expired')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_own_agreement ON agreements;
CREATE POLICY tenant_own_agreement ON agreements FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS landlord_agreements ON agreements;
CREATE POLICY landlord_agreements ON agreements FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
CREATE INDEX IF NOT EXISTS idx_agreements_tenant ON agreements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);

CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, content text NOT NULL,
  sender_id uuid REFERENCES profiles(user_id), sender_name text NOT NULL,
  recipient_id text NOT NULL DEFAULT 'ALL',
  type text NOT NULL DEFAULT 'General' CONSTRAINT check_notice_type CHECK (type IN ('General','Renewal','Default','Maintenance')),
  read_by uuid[] DEFAULT '{}', sent_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notices_landlord_insert ON notices;
CREATE POLICY notices_landlord_insert ON notices FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'landlord'));
DROP POLICY IF EXISTS notices_auth_select ON notices;
CREATE POLICY notices_auth_select ON notices FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_notices_type ON notices(type);
CREATE INDEX IF NOT EXISTS idx_notices_sent ON notices(sent_at DESC);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL, email text, full_name text,
  role text NOT NULL DEFAULT 'tenant',
  property_id uuid REFERENCES properties(id), unit_id uuid REFERENCES units(id),
  token text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'pending',
  payment_history jsonb DEFAULT '[]'::jsonb, notes text,
  invited_by uuid REFERENCES profiles(user_id),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz, accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invitations_landlord_all ON invitations;
CREATE POLICY invitations_landlord_all ON invitations FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
DROP POLICY IF EXISTS invitations_self_select ON invitations;
CREATE POLICY invitations_self_select ON invitations FOR SELECT USING (phone = (SELECT phone FROM profiles WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_phone ON invitations(phone);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  property_id uuid REFERENCES properties(id),
  action text NOT NULL, entity_type text NOT NULL, entity_id uuid,
  old_values jsonb, new_values jsonb, ip_address inet, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_landlord_select ON audit_logs;
CREATE POLICY audit_logs_landlord_select ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
DROP POLICY IF EXISTS audit_logs_system_insert ON audit_logs;
CREATE POLICY audit_logs_system_insert ON audit_logs FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_address text NOT NULL, subject text NOT NULL,
  html_body text, text_body text,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0, error text,
  created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_queue_insert ON email_queue;
CREATE POLICY email_queue_insert ON email_queue FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS email_queue_select ON email_queue;
CREATE POLICY email_queue_select ON email_queue FOR SELECT USING (true);
DROP POLICY IF EXISTS email_queue_update ON email_queue;
CREATE POLICY email_queue_update ON email_queue FOR UPDATE USING (true);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);