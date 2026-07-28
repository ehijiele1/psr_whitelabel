-- Migration: Hash plaintext PINs in settings table
-- This migration addresses the security issue of storing PINs in plaintext
-- by hashing them using bcrypt (via pgcrypto extension)

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add hashed PIN columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS landlord_pin_hash text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS caretaker_pin_hash text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_pin_hash text;

-- Create a function to hash PINs using bcrypt
-- Note: bcrypt is the most secure option available in PostgreSQL for password hashing
CREATE OR REPLACE FUNCTION hash_pin(pin text) RETURNS text AS $$
BEGIN
  IF pin IS NULL OR pin = '' THEN
    RETURN NULL;
  END IF;
  -- Use crypt() with bcrypt (cost factor 10)
  RETURN crypt(pin, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify PINs against hashed values
CREATE OR REPLACE FUNCTION verify_pin(pin text, hash text) RETURNS boolean AS $$
BEGIN
  IF pin IS NULL OR hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN crypt(pin, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing plaintext PINs to hashed values
-- Only hash non-null, non-empty, non-default PINs
UPDATE settings SET landlord_pin_hash = hash_pin(landlord_pin) 
WHERE landlord_pin IS NOT NULL AND landlord_pin != '' AND landlord_pin NOT IN ('1234', '0000');

UPDATE settings SET caretaker_pin_hash = hash_pin(caretaker_pin) 
WHERE caretaker_pin IS NOT NULL AND caretaker_pin != '' AND caretaker_pin NOT IN ('5678', '0000');

UPDATE settings SET tenant_pin_hash = hash_pin(tenant_pin) 
WHERE tenant_pin IS NOT NULL AND tenant_pin != '' AND tenant_pin NOT IN ('0000', '1234', '5678');

-- Clear plaintext PINs that were hashed (optional - can be done in a separate migration)
-- For now, we'll keep the plaintext columns but mark them as deprecated
-- A future migration can drop these columns once all code is updated

-- Create a view for backward compatibility that returns NULL for plaintext PINs
-- This encourages migration to the hashed versions
CREATE OR REPLACE VIEW settings_secure AS
SELECT 
  id, property_name, landlord_name, address, emergency_phone,
  caretaker_name, caretaker_phone, bank_name, account_number,
  account_name, email, signature_url, whatsapp_number, updated_at,
  -- Return hashed PINs only
  NULL as landlord_pin,
  NULL as caretaker_pin,
  NULL as tenant_pin,
  landlord_pin_hash,
  caretaker_pin_hash,
  tenant_pin_hash
FROM settings;

-- Create helper functions for application code
CREATE OR REPLACE FUNCTION set_landlord_pin(new_pin text) RETURNS void AS $$
BEGIN
  UPDATE settings SET landlord_pin_hash = hash_pin(new_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_caretaker_pin(new_pin text) RETURNS void AS $$
BEGIN
  UPDATE settings SET caretaker_pin_hash = hash_pin(new_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_tenant_pin(new_pin text) RETURNS void AS $$
BEGIN
  UPDATE settings SET tenant_pin_hash = hash_pin(new_pin);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_landlord_pin(pin text) RETURNS boolean AS $$
DECLARE
  hash text;
BEGIN
  SELECT landlord_pin_hash INTO hash FROM settings LIMIT 1;
  RETURN verify_pin(pin, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_caretaker_pin(pin text) RETURNS boolean AS $$
DECLARE
  hash text;
BEGIN
  SELECT caretaker_pin_hash INTO hash FROM settings LIMIT 1;
  RETURN verify_pin(pin, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_tenant_pin(pin text) RETURNS boolean AS $$
DECLARE
  hash text;
BEGIN
  SELECT tenant_pin_hash INTO hash FROM settings LIMIT 1;
  RETURN verify_pin(pin, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
