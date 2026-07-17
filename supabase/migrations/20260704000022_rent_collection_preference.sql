ALTER TABLE properties ADD COLUMN IF NOT EXISTS rent_collection text NOT NULL DEFAULT 'automatic'
  CONSTRAINT check_rent_collection CHECK (rent_collection IN ('automatic', 'manual'));
