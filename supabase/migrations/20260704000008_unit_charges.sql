-- PrinceSteve Residence Migration 08: Unit Charges
CREATE TABLE IF NOT EXISTS unit_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  charge_type text NOT NULL CONSTRAINT check_charge_type CHECK (charge_type IN ('lawma','sanitation','luc','service','other')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE unit_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlord manages unit charges" ON unit_charges;
CREATE POLICY "Landlord manages unit charges" ON unit_charges
  FOR ALL USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE p.landlord_id = auth.uid()
    )
  ) WITH CHECK (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE p.landlord_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff reads unit charges" ON unit_charges;
CREATE POLICY "Staff reads unit charges" ON unit_charges
  FOR SELECT USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON p.id = u.property_id
      WHERE p.landlord_id IN (
        SELECT user_id FROM profiles WHERE role IN ('landlord','caretaker')
      )
    )
  );

DROP TRIGGER IF EXISTS update_unit_charges_updated_at ON unit_charges;
CREATE TRIGGER update_unit_charges_updated_at
  BEFORE UPDATE ON unit_charges FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_unit_charges_unit_id ON unit_charges(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_charges_type ON unit_charges(charge_type);
CREATE INDEX IF NOT EXISTS idx_unit_charges_effective ON unit_charges(effective_from, effective_to);