-- PrinceSteve Residence Migration 11: ID Verifications
CREATE TABLE IF NOT EXISTS id_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CONSTRAINT check_id_doc_type CHECK (document_type IN ('national_id','passport','drivers_license','voters_card')),
  document_url text NOT NULL,
  document_number text,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES profiles(user_id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS id_verifications_self_all ON id_verifications;
CREATE POLICY id_verifications_self_all ON id_verifications FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS id_verifications_landlord_all ON id_verifications;
CREATE POLICY id_verifications_landlord_all ON id_verifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord')
);

DROP TRIGGER IF EXISTS update_id_verifications_updated_at ON id_verifications;
CREATE TRIGGER update_id_verifications_updated_at
  BEFORE UPDATE ON id_verifications FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_id_verifications_user ON id_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_id_verifications_verified ON id_verifications(verified);