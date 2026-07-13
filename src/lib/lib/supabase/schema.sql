-- ================================================================
-- PRINCESTEVE RESIDENCE — PRODUCTION DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ── PROFILES ─────────────────────────────────────────────────────
CREATE TABLE profiles (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role         text NOT NULL DEFAULT 'tenant'
               CONSTRAINT check_role CHECK (role IN ('landlord','caretaker','tenant','applicant')),
  full_name    text NOT NULL,
  phone        text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Landlord reads all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- ── SETTINGS ─────────────────────────────────────────────────────
CREATE TABLE settings (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_name    text NOT NULL DEFAULT 'PrinceSteve Residence',
  landlord_name    text NOT NULL DEFAULT 'Mrs. Ibadin R.E',
  address          text NOT NULL DEFAULT '35 Godilove Street, Akowonjo Egbeda, Lagos',
  emergency_phone  text DEFAULT '+2348054164910',
  caretaker_name   text DEFAULT 'Steve',
  caretaker_phone  text DEFAULT '+2348024427735',
  bank_name        text DEFAULT 'First Bank Nigeria',
  account_number   text DEFAULT '3012345678',
  account_name     text DEFAULT 'Prince Steve Residence',
  email            text DEFAULT 'beckydin63@gmail.com',
  landlord_pin     text DEFAULT '1234',
  caretaker_pin    text DEFAULT '5678',
  tenant_pin       text DEFAULT '0000',
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Only landlord reads/updates settings
CREATE POLICY "Landlord manages settings"
  ON settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

INSERT INTO settings DEFAULT VALUES;

-- ── UNITS ─────────────────────────────────────────────────────────
CREATE TABLE units (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  type         text NOT NULL CONSTRAINT check_unit_type CHECK (type IN ('apartment','shop','stall')),
  occupied     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read units
CREATE POLICY "Authenticated users read units"
  ON units FOR SELECT TO authenticated USING (true);

-- Only landlord can modify units
CREATE POLICY "Landlord manages units"
  ON units FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

INSERT INTO units (name, type, occupied) VALUES
  ('Apt 1', 'apartment', true),
  ('Apt 2', 'apartment', true),
  ('Apt 3', 'apartment', true),
  ('Apt 4', 'apartment', false),
  ('Shop 1', 'shop', true),
  ('Shop 2', 'shop', false),
  ('Stall 1', 'stall', false),
  ('Stall 2', 'stall', true);

-- ── TENANTS ───────────────────────────────────────────────────────
CREATE TABLE tenants (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name                text NOT NULL,
  phone               text NOT NULL,
  phone2              text,
  email               text,
  sex                 text,
  state_of_origin     text,
  tribe               text,
  lga                 text,
  home_address        text,
  nationality         text DEFAULT 'Nigerian',
  religion            text,
  reason_moving       text,
  occupation          text,
  employer            text,
  employer_address    text,
  employer_duration   text,
  job_title           text,
  office_phone        text,
  guarantor           text,
  guarantor_address   text,
  guarantor_phone     text,
  guarantor_occupation text,
  nin                 text,          -- Encrypted at rest, landlord-only
  unit                text NOT NULL,
  unit_id             uuid REFERENCES units(id),
  type                text NOT NULL CONSTRAINT check_tenant_unit_type CHECK (type IN ('apartment','shop','stall')),
  lease_start         date NOT NULL,
  lease_end           date NOT NULL,
  rent                numeric(15,2) NOT NULL,
  security_deposit    numeric(15,2),
  pay_freq            text NOT NULL DEFAULT 'annual'
                      CONSTRAINT check_pay_freq CHECK (pay_freq IN ('annual','bi-annual','quarterly','monthly')),
  status              text NOT NULL DEFAULT 'active'
                      CONSTRAINT check_tenant_status CHECK (status IN ('active','vacated','pending')),
  photo               text,          -- base64 or storage URL
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants read only their own record
CREATE POLICY "Tenant reads own record"
  ON tenants FOR SELECT USING (auth.uid() = user_id);

-- Caretaker reads all tenants but CANNOT see NIN (handled at app layer)
CREATE POLICY "Caretaker reads tenants"
  ON tenants FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('caretaker','landlord'))
  );

-- Landlord full access
CREATE POLICY "Landlord manages tenants"
  ON tenants FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- ── RECEIPTS SEQUENCE FUNCTION ────────────────────────────────────
-- Atomic, server-side receipt numbering. Never generated on frontend.
CREATE SEQUENCE IF NOT EXISTS receipt_rent_seq START 1;
CREATE SEQUENCE IF NOT EXISTS receipt_levy_seq START 1;

CREATE OR REPLACE FUNCTION generate_receipt_number(p_type text, p_year int)
RETURNS text AS $$
DECLARE
  seq_val bigint;
  prefix  text;
BEGIN
  IF p_type = 'rent' THEN
    seq_val := nextval('receipt_rent_seq');
    prefix  := 'RENT';
  ELSE
    seq_val := nextval('receipt_levy_seq');
    prefix  := 'LEVY';
  END IF;
  RETURN 'PSR-' || p_year::text || '-' || prefix || '-' || lpad(seq_val::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ── PAYMENTS ──────────────────────────────────────────────────────
CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         uuid REFERENCES tenants(id) NOT NULL,
  tenant_name       text NOT NULL,
  unit              text NOT NULL,
  type              text NOT NULL CONSTRAINT check_pay_type CHECK (type IN ('rent','levy')),
  amount            numeric(15,2) NOT NULL CHECK (amount > 0),
  method            text NOT NULL CONSTRAINT check_method CHECK (method IN ('cash','bank transfer','paystack')),
  date              date NOT NULL,
  period            text,
  receipt_no        text UNIQUE,     -- Set by trigger, not frontend
  status            text NOT NULL DEFAULT 'pending'
                    CONSTRAINT check_pay_status CHECK (status IN ('pending','approved','rejected')),
  is_partial        boolean NOT NULL DEFAULT false,
  partial_of        numeric(15,2),
  levy_breakdown    jsonb,
  paystack_ref      text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Trigger: auto-generate receipt number on insert
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_no IS NULL THEN
    NEW.receipt_no := generate_receipt_number(NEW.type, EXTRACT(YEAR FROM NEW.date)::int);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_number
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION set_receipt_number();

-- RLS: Tenant reads own payments only
CREATE POLICY "Tenant reads own payments"
  ON payments FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
  );

-- RLS: Caretaker CANNOT read payments (financial lockout)
-- (no caretaker policy = no access)

-- RLS: Landlord full access
CREATE POLICY "Landlord manages payments"
  ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- ── APPLICANTS ────────────────────────────────────────────────────
CREATE TABLE applicants (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 text NOT NULL,
  phone                text NOT NULL,
  phone2               text,
  email                text,
  sex                  text,
  state_of_origin      text,
  tribe                text,
  lga                  text,
  home_address         text,
  nationality          text DEFAULT 'Nigerian',
  religion             text,
  reason_moving        text,
  occupation           text,
  employer             text,
  employer_address     text,
  employer_duration    text,
  job_title            text,
  office_phone         text,
  guarantor            text,
  guarantor_address    text,
  guarantor_phone      text,
  guarantor_occupation text,
  nin                  text,
  photo                text,
  unit_type            text NOT NULL DEFAULT 'apartment',
  move_in              date,
  payment_status       text NOT NULL DEFAULT 'unpaid'
                       CONSTRAINT check_app_pay_status CHECK (payment_status IN ('unpaid','proof-submitted','paid')),
  payment_amount       numeric(15,2),
  payment_date         date,
  payment_ref          text,
  payment_method       text,
  depositor_name       text,
  proof_image          text,
  signature_data       text,
  signature_type       text,
  agreed_on            date,
  unit_assigned        text,
  stage                text NOT NULL DEFAULT 'form-submitted',
  submitted_at         timestamptz NOT NULL DEFAULT now(),
  reviewed_at          timestamptz,
  rejection_reason     text
);
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Only landlord reads/manages applicants
CREATE POLICY "Landlord manages applicants"
  ON applicants FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- Applicants can insert their own record (public)
CREATE POLICY "Public can submit application"
  ON applicants FOR INSERT WITH CHECK (true);

-- ── TICKETS ───────────────────────────────────────────────────────
CREATE TABLE tickets (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    uuid REFERENCES tenants(id) NOT NULL,
  tenant_name  text NOT NULL,
  unit         text NOT NULL,
  title        text NOT NULL,
  description  text,
  category     text NOT NULL DEFAULT 'Other',
  status       text NOT NULL DEFAULT 'pending'
               CONSTRAINT check_ticket_status CHECK (status IN ('pending','in-progress','resolved')),
  priority     text NOT NULL DEFAULT 'medium'
               CONSTRAINT check_priority CHECK (priority IN ('low','medium','high')),
  notes        text,
  resolved_by  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Tenants read/insert own tickets
CREATE POLICY "Tenant manages own tickets"
  ON tickets FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
  );
CREATE POLICY "Tenant inserts tickets"
  ON tickets FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
  );

-- Caretaker reads and updates tickets (but not financials — separate table)
CREATE POLICY "Caretaker reads all tickets"
  ON tickets FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('caretaker','landlord'))
  );
CREATE POLICY "Caretaker updates tickets"
  ON tickets FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('caretaker','landlord'))
  );

-- Landlord full access
CREATE POLICY "Landlord manages tickets"
  ON tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- Trigger: update updated_at on status change
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_updated
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_ticket_timestamp();

-- ── INBOX ─────────────────────────────────────────────────────────
CREATE TABLE inbox (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         text NOT NULL CONSTRAINT check_inbox_type CHECK (type IN ('application','message','proof','agreement')),
  from_name    text NOT NULL,
  subject      text NOT NULL,
  preview      text,
  read         boolean NOT NULL DEFAULT false,
  applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
  tenant_id    uuid REFERENCES tenants(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;

-- Only landlord reads inbox
CREATE POLICY "Landlord reads inbox"
  ON inbox FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- Allow public inserts for applicant submissions
CREATE POLICY "Public can create inbox messages"
  ON inbox FOR INSERT WITH CHECK (true);

-- ── ACTIVITY LOG ──────────────────────────────────────────────────
CREATE TABLE activity (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  icon       text NOT NULL DEFAULT 'ti-bolt',
  color      text NOT NULL DEFAULT '#DCFCE7',
  icon_color text NOT NULL DEFAULT '#16A34A',
  text       text NOT NULL,
  time       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Landlord and caretaker read activity
CREATE POLICY "Staff reads activity"
  ON activity FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('landlord','caretaker'))
  );

CREATE POLICY "Landlord manages activity"
  ON activity FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- ── TENANCY AGREEMENTS ────────────────────────────────────────────
CREATE TABLE agreements (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         uuid REFERENCES tenants(id) NOT NULL,
  applicant_id      uuid REFERENCES applicants(id),
  unsigned_url      text,           -- Storage path to unsigned PDF
  signed_url        text,           -- Storage path to signed copy
  signature_data    text,           -- base64 or typed name
  signature_type    text,
  signed_at         timestamptz,
  lease_start       date,
  lease_end         date,
  rent_amount       numeric(15,2),
  security_deposit  numeric(15,2),
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Tenant reads own agreement
CREATE POLICY "Tenant reads own agreement"
  ON agreements FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
  );

-- Landlord full access
CREATE POLICY "Landlord manages agreements"
  ON agreements FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
  );

-- ── VIEWS (convenience, Landlord only) ───────────────────────────
CREATE OR REPLACE VIEW landlord_financial_summary AS
SELECT
  t.unit,
  t.name AS tenant_name,
  t.rent AS annual_rent,
  t.pay_freq,
  t.lease_end,
  COALESCE(SUM(p.amount) FILTER (WHERE p.type='rent' AND p.status='approved'), 0) AS rent_paid,
  COALESCE(SUM(p.amount) FILTER (WHERE p.type='levy' AND p.status='approved'), 0) AS levy_paid,
  t.rent - COALESCE(SUM(p.amount) FILTER (WHERE p.type='rent' AND p.status='approved'), 0) AS outstanding
FROM tenants t
LEFT JOIN payments p ON p.tenant_id = t.id
WHERE t.status = 'active'
GROUP BY t.id, t.unit, t.name, t.rent, t.pay_freq, t.lease_end;

-- ── INDEXES ───────────────────────────────────────────────────────
CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_tenants_unit ON tenants(unit);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_inbox_read ON inbox(read);
CREATE INDEX idx_activity_time ON activity(time DESC);
