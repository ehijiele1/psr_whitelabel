-- PrinceSteve Residence Migration 10: Lease Agreements
CREATE TABLE IF NOT EXISTS lease_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  agreement_url text NOT NULL,
  signed_by_tenant boolean NOT NULL DEFAULT false,
  signed_by_landlord boolean NOT NULL DEFAULT false,
  signed_at timestamptz,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lease_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lease_agreements_tenant_own ON lease_agreements;
CREATE POLICY lease_agreements_tenant_own ON lease_agreements FOR SELECT USING (
  tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS lease_agreements_landlord_all ON lease_agreements;
CREATE POLICY lease_agreements_landlord_all ON lease_agreements FOR ALL USING (
  tenant_id IN (
    SELECT t.id FROM tenants t
    JOIN units u ON u.id = t.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE p.landlord_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_lease_agreements_updated_at ON lease_agreements;
CREATE TRIGGER update_lease_agreements_updated_at
  BEFORE UPDATE ON lease_agreements FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_lease_agreements_tenant ON lease_agreements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_agreements_created ON lease_agreements(created_at DESC);