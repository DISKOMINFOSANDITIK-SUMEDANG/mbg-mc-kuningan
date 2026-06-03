-- Migration: Add Offtaker Management Tables
-- Adds roles and relationship tables referenced by the backend auth and CMS services.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('administrator', 'sekolah', 'sppg', 'group', 'pemasok', 'offtaker', 'dinas_pertanian'));

CREATE TABLE IF NOT EXISTS offtakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  subdistrict VARCHAR(100),
  district VARCHAR(100),
  province VARCHAR(100),
  pic_name VARCHAR(255),
  pic_phone VARCHAR(20),
  warehouse_address TEXT,
  warehouse_capacity NUMERIC(15, 2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offtaker_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offtaker_id UUID NOT NULL REFERENCES offtakers(id) ON DELETE CASCADE,
  position VARCHAR(100) DEFAULT 'Owner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, offtaker_id)
);

CREATE INDEX IF NOT EXISTS idx_offtakers_status ON offtakers(status);
CREATE INDEX IF NOT EXISTS idx_offtakers_name ON offtakers(name);
CREATE INDEX IF NOT EXISTS idx_offtaker_users_user_id ON offtaker_users(user_id);
CREATE INDEX IF NOT EXISTS idx_offtaker_users_offtaker_id ON offtaker_users(offtaker_id);
