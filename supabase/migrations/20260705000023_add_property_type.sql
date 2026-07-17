-- PrinceSteve Residence Migration 23: Add type column to properties
-- Also add ON DELETE CASCADE on property_id foreign keys for clean deletion

ALTER TABLE properties ADD COLUMN IF NOT EXISTS type text
  CONSTRAINT check_property_type CHECK (type IS NULL OR type IN ('Residential', 'Commercial', 'Mixed'));

-- Drop existing FK constraints and re-add with CASCADE
ALTER TABLE units
  DROP CONSTRAINT IF EXISTS units_property_id_fkey,
  ADD CONSTRAINT units_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_property_id_fkey,
  ADD CONSTRAINT tenants_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_property_id_fkey,
  ADD CONSTRAINT payments_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE tickets
  DROP CONSTRAINT IF EXISTS tickets_property_id_fkey,
  ADD CONSTRAINT tickets_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE applicants
  DROP CONSTRAINT IF EXISTS applicants_property_id_fkey,
  ADD CONSTRAINT applicants_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_property_id_fkey,
  ADD CONSTRAINT applications_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE tenant_subscriptions
  DROP CONSTRAINT IF EXISTS tenant_subscriptions_property_id_fkey,
  ADD CONSTRAINT tenant_subscriptions_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Cascade on remaining property_id FKs
ALTER TABLE agreements
  DROP CONSTRAINT IF EXISTS agreements_property_id_fkey,
  ADD CONSTRAINT agreements_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_property_id_fkey,
  ADD CONSTRAINT invitations_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_property_id_fkey,
  ADD CONSTRAINT audit_logs_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- Cascade on tenant_id FKs (tenants are deleted via property cascade)
ALTER TABLE agreements
  DROP CONSTRAINT IF EXISTS agreements_tenant_id_fkey,
  ADD CONSTRAINT agreements_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Cascade on applicant_id FKs
ALTER TABLE agreements
  DROP CONSTRAINT IF EXISTS agreements_applicant_id_fkey,
  ADD CONSTRAINT agreements_applicant_id_fkey
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE SET NULL;

-- SET NULL on remaining unit_id references
ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_unit_id_fkey,
  ADD CONSTRAINT tenants_unit_id_fkey
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_unit_id_fkey,
  ADD CONSTRAINT applications_unit_id_fkey
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_unit_id_fkey,
  ADD CONSTRAINT invitations_unit_id_fkey
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

-- Allow landlords to update profiles (required when approving applications)
DROP POLICY IF EXISTS "Landlord updates profiles" ON profiles;
CREATE POLICY "Landlord updates profiles" ON profiles
  FOR UPDATE USING (get_my_role() = 'landlord');
