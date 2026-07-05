-- PrinceSteve Residence Migration 02: File Storage
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL, file_type text NOT NULL, file_size bigint,
  storage_path text, storage_bucket text DEFAULT 'documents',
  is_base64 boolean NOT NULL DEFAULT false, base64_data text,
  uploaded_by uuid REFERENCES profiles(user_id),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  applicant_id uuid REFERENCES applicants(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CONSTRAINT check_file_status CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS files_landlord_all ON files;
CREATE POLICY files_landlord_all ON files FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'landlord'));
DROP POLICY IF EXISTS files_tenant_select ON files;
CREATE POLICY files_tenant_select ON files FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS files_applicant_insert ON files;
CREATE POLICY files_applicant_insert ON files FOR INSERT WITH CHECK (applicant_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_files_tenant ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_applicant ON files(applicant_id);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('agreements', 'agreements', false) ON CONFLICT (id) DO NOTHING;