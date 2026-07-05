-- PrinceSteve Residence Migration 00: Base Schema (Deployment)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Phase 1: Tables
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'tenant' CONSTRAINT check_role CHECK (role IN ('landlord','caretaker','tenant','applicant')),
  full_name text NOT NULL, phone text, avatar_url text,
  email_verified boolean DEFAULT false, last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL DEFAULT 'PrinceSteve Residence',
  landlord_name text NOT NULL DEFAULT 'Mrs. Ibadin R.E',
  address text NOT NULL DEFAULT '35 Godilove Street, Akowonjo Egbeda, Lagos',
  emergency_phone text DEFAULT '+2348054164910',
  caretaker_name text DEFAULT 'Steve', caretaker_phone text DEFAULT '+2348024427735',
  bank_name text DEFAULT 'First Bank Nigeria', account_number text DEFAULT '3012345678',
  account_name text DEFAULT 'Prince Steve Residence', email text DEFAULT 'beckydin63@gmail.com',
  landlord_pin text DEFAULT '1234', caretaker_pin text DEFAULT '5678', tenant_pin text DEFAULT '0000',
  signature_url text, whatsapp_number text, updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES profiles(user_id) NOT NULL,
  name text NOT NULL, address text NOT NULL, description text,
  emergency_contact text, caretaker_contact text,
  bank_name text DEFAULT 'First Bank Nigeria', account_number text DEFAULT '3012345678',
  account_name text DEFAULT 'Prince Steve Residence',
  status text NOT NULL DEFAULT 'active' CONSTRAINT check_property_status CHECK (status IN ('active','inactive','maintenance')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  name text NOT NULL,
  type text NOT NULL CONSTRAINT check_unit_type CHECK (type IN ('apartment','shop','stall')),
  occupied boolean NOT NULL DEFAULT false,
  status text DEFAULT 'available' CONSTRAINT check_unit_status CHECK (status IN ('available','occupied','maintenance','unavailable')),
  monthly_rent numeric(12,2), deposit_amount numeric(12,2), description text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id uuid REFERENCES properties(id), name text NOT NULL, phone text NOT NULL,
  phone2 text, email text, sex text, state_of_origin text, tribe text, lga text,
  home_address text, nationality text DEFAULT 'Nigerian', religion text, reason_moving text,
  occupation text, employer text, employer_address text, employer_duration text,
  job_title text, office_phone text, guarantor text, guarantor_address text,
  guarantor_phone text, guarantor_occupation text, nin text,
  unit text NOT NULL, unit_id uuid REFERENCES units(id),
  type text NOT NULL CONSTRAINT check_tenant_unit_type CHECK (type IN ('apartment','shop','stall')),
  lease_start date NOT NULL, lease_end date NOT NULL,
  rent numeric(15,2) NOT NULL, security_deposit numeric(15,2),
  pay_freq text NOT NULL DEFAULT 'annual' CONSTRAINT check_pay_freq CHECK (pay_freq IN ('annual','bi-annual','quarterly','monthly')),
  status text NOT NULL DEFAULT 'active' CONSTRAINT check_tenant_status CHECK (status IN ('active','vacated','pending')),
  photo text, notes text, approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS receipt_rent_seq START 1;
CREATE SEQUENCE IF NOT EXISTS receipt_levy_seq START 1;

CREATE OR REPLACE FUNCTION generate_receipt_number(p_type text, p_year int)
RETURNS text AS $$ DECLARE seq_val bigint; prefix text; BEGIN
  IF p_type = 'rent' THEN seq_val := nextval('receipt_rent_seq'); prefix := 'RENT';
  ELSE seq_val := nextval('receipt_levy_seq'); prefix := 'LEVY'; END IF;
  RETURN 'PSR-' || p_year::text || '-' || prefix || '-' || lpad(seq_val::text, 6, '0');
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_receipt_number() RETURNS TRIGGER AS $$ BEGIN
  IF NEW.receipt_no IS NULL THEN
    NEW.receipt_no := generate_receipt_number(NEW.type, EXTRACT(YEAR FROM NEW.date)::int);
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ticket_timestamp() RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at := now(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = now(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  property_id uuid REFERENCES properties(id), tenant_name text NOT NULL, unit text NOT NULL,
  type text NOT NULL CONSTRAINT check_pay_type CHECK (type IN ('rent','levy')),
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CONSTRAINT check_method CHECK (method IN ('cash','bank transfer','paystack')),
  date date NOT NULL, period text, receipt_no text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CONSTRAINT check_pay_status CHECK (status IN ('pending','approved','rejected')),
  is_partial boolean NOT NULL DEFAULT false, partial_of numeric(15,2),
  levy_breakdown jsonb, paystack_ref text, approved_by uuid, approved_at timestamptz, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  name text NOT NULL, phone text NOT NULL, phone2 text, email text,
  sex text, state_of_origin text, tribe text, lga text, home_address text,
  nationality text DEFAULT 'Nigerian', religion text, reason_moving text,
  occupation text, employer text, employer_address text, employer_duration text,
  job_title text, office_phone text, guarantor text, guarantor_address text,
  guarantor_phone text, guarantor_occupation text, nin text, photo text,
  unit_type text NOT NULL DEFAULT 'apartment', move_in date,
  payment_status text NOT NULL DEFAULT 'unpaid' CONSTRAINT check_app_pay_status CHECK (payment_status IN ('unpaid','proof-submitted','paid')),
  payment_amount numeric(15,2), payment_date date, payment_ref text,
  payment_method text, depositor_name text, proof_image text,
  signature_data text, signature_type text, agreed_on date, unit_assigned text,
  stage text NOT NULL DEFAULT 'form-submitted', reviewed_by uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz,
  rejection_reason text, updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  property_id uuid REFERENCES properties(id),
  tenant_name text NOT NULL, unit text NOT NULL, title text NOT NULL, description text,
  category text NOT NULL DEFAULT 'Other',
  status text NOT NULL DEFAULT 'pending' CONSTRAINT check_ticket_status CHECK (status IN ('pending','in-progress','resolved')),
  priority text NOT NULL DEFAULT 'medium' CONSTRAINT check_priority CHECK (priority IN ('low','medium','high')),
  notes text, resolved_by text, assigned_to uuid, resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CONSTRAINT check_inbox_type CHECK (type IN ('application','message','proof','agreement')),
  from_name text NOT NULL, subject text NOT NULL, preview text,
  read boolean NOT NULL DEFAULT false, applicant_id uuid, tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'ti-bolt', color text NOT NULL DEFAULT '#DCFCE7',
  icon_color text NOT NULL DEFAULT '#16A34A', text text NOT NULL,
  time timestamptz NOT NULL DEFAULT now()
);

-- Phase 2: RLS, Policies, Triggers, Indexes, Views
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Landlord reads all profiles" ON profiles;
CREATE POLICY "Landlord reads all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landlord manages settings" ON settings;
CREATE POLICY "Landlord manages settings" ON settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
INSERT INTO settings DEFAULT VALUES;

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS properties_landlord_all ON properties;
CREATE POLICY properties_landlord_all ON properties FOR ALL USING (landlord_id = auth.uid()) WITH CHECK (landlord_id = auth.uid());
DROP POLICY IF EXISTS properties_caretaker_select ON properties;
CREATE POLICY properties_caretaker_select ON properties FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'caretaker'));
DROP POLICY IF EXISTS properties_tenant_select ON properties;
CREATE POLICY properties_tenant_select ON properties FOR SELECT USING (EXISTS (SELECT 1 FROM tenants t JOIN units u ON u.id = t.unit_id WHERE t.user_id = auth.uid() AND u.property_id = properties.id));

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS units_landlord_all ON units;
CREATE POLICY units_landlord_all ON units FOR ALL USING (property_id IN (SELECT id FROM properties WHERE landlord_id = auth.uid()));
DROP POLICY IF EXISTS units_staff_select ON units;
CREATE POLICY units_staff_select ON units FOR SELECT USING (property_id IN (SELECT id FROM properties));
DROP POLICY IF EXISTS units_tenant_select ON units;
CREATE POLICY units_tenant_select ON units FOR SELECT USING (id IN (SELECT unit_id FROM tenants WHERE user_id = auth.uid()));

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant reads own record" ON tenants;
CREATE POLICY "Tenant reads own record" ON tenants FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Caretaker reads tenants" ON tenants;
CREATE POLICY "Caretaker reads tenants" ON tenants FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('caretaker','landlord')));
DROP POLICY IF EXISTS "Landlord manages tenants" ON tenants;
CREATE POLICY "Landlord manages tenants" ON tenants FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant reads own payments" ON payments;
CREATE POLICY "Tenant reads own payments" ON payments FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Landlord manages payments" ON payments;
CREATE POLICY "Landlord manages payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

DROP TRIGGER IF EXISTS trg_receipt_number ON payments;
CREATE TRIGGER trg_receipt_number BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION set_receipt_number();

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landlord manages applicants" ON applicants;
CREATE POLICY "Landlord manages applicants" ON applicants FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
DROP POLICY IF EXISTS "Public can submit application" ON applicants;
CREATE POLICY "Public can submit application" ON applicants FOR INSERT WITH CHECK (true);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant manages own tickets" ON tickets;
CREATE POLICY "Tenant manages own tickets" ON tickets FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Tenant inserts tickets" ON tickets;
CREATE POLICY "Tenant inserts tickets" ON tickets FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Caretaker reads all tickets" ON tickets;
CREATE POLICY "Caretaker reads all tickets" ON tickets FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('caretaker','landlord')));
DROP POLICY IF EXISTS "Caretaker updates tickets" ON tickets;
CREATE POLICY "Caretaker updates tickets" ON tickets FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('caretaker','landlord')));
DROP POLICY IF EXISTS "Landlord manages tickets" ON tickets;
CREATE POLICY "Landlord manages tickets" ON tickets FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

DROP TRIGGER IF EXISTS trg_ticket_updated ON tickets;
CREATE TRIGGER trg_ticket_updated BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_ticket_timestamp();

ALTER TABLE inbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landlord reads inbox" ON inbox;
CREATE POLICY "Landlord reads inbox" ON inbox FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
DROP POLICY IF EXISTS "Public can create inbox messages" ON inbox;
CREATE POLICY "Public can create inbox messages" ON inbox FOR INSERT WITH CHECK (true);

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff reads activity" ON activity;
CREATE POLICY "Staff reads activity" ON activity FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('landlord','caretaker')));
DROP POLICY IF EXISTS "Landlord manages activity" ON activity;
CREATE POLICY "Landlord manages activity" ON activity FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE VIEW landlord_financial_summary AS
SELECT p.id AS property_id, p.name AS property_name, t.id AS tenant_id, t.unit, t.name AS tenant_name,
  t.rent AS annual_rent, t.pay_freq, t.lease_end,
  COALESCE(SUM(pay.amount) FILTER (WHERE pay.type='rent' AND pay.status='approved'), 0) AS rent_paid,
  COALESCE(SUM(pay.amount) FILTER (WHERE pay.type='levy' AND pay.status='approved'), 0) AS levy_paid,
  t.rent - COALESCE(SUM(pay.amount) FILTER (WHERE pay.type='rent' AND pay.status='approved'), 0) AS outstanding
FROM tenants t JOIN properties p ON p.id = t.property_id
LEFT JOIN payments pay ON pay.tenant_id = t.id
WHERE t.status = 'active' GROUP BY p.id, p.name, t.id, t.unit, t.name, t.rent, t.pay_freq, t.lease_end;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit ON tenants(unit);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant_id ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_property ON tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_inbox_read ON inbox(read);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity(time DESC);
CREATE INDEX IF NOT EXISTS idx_applicants_property ON applicants(property_id);
