-- PrinceSteve Residence Migration 01: Multi-Property indexes and linking
-- (Table creation moved to 00_base_schema.sql)
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id);