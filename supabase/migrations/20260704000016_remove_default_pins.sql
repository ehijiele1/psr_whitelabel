-- PrinceSteve Residence Migration 16: Remove hardcoded default PINs
-- base_schema seeded guessable PINs (1234/5678/0000) on every deployment.
-- Drop the insecure defaults and clear any values that still match them.

ALTER TABLE settings ALTER COLUMN landlord_pin DROP DEFAULT;
ALTER TABLE settings ALTER COLUMN caretaker_pin DROP DEFAULT;
ALTER TABLE settings ALTER COLUMN tenant_pin DROP DEFAULT;

UPDATE settings SET landlord_pin = NULL WHERE landlord_pin = '1234';
UPDATE settings SET caretaker_pin = NULL WHERE caretaker_pin = '5678';
UPDATE settings SET tenant_pin = NULL WHERE tenant_pin = '0000';
