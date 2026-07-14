-- PrinceSteve Residence Migration 09: Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id),
  unit_id uuid REFERENCES units(id),
  form_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CONSTRAINT check_app_status CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS applications_public_insert ON applications;
CREATE POLICY applications_public_insert ON applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS applications_landlord_all ON applications;
CREATE POLICY applications_landlord_all ON applications FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));

DROP POLICY IF EXISTS applications_tenant_own ON applications;
CREATE POLICY applications_tenant_own ON applications FOR SELECT USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_property ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_unit ON applications(unit_id);
CREATE INDEX IF NOT EXISTS idx_applications_submitted ON applications(submitted_at DESC);