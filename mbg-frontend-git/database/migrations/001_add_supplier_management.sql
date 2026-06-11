-- Migration: Add Supplier Management Tables for MBG Program
-- This migration adds support for:
-- 1. Pemasok (Supplier) role
-- 2. Supplier management
-- 3. Commodity categories and commodities
-- 4. Supplier products (many-to-many relationship)

-- ============================================
-- 1. Update users table to add 'pemasok' role
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('administrator', 'sekolah', 'sppg', 'group', 'pemasok'));

-- ============================================
-- 2. Create suppliers table
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    district VARCHAR(100),
    village VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_district ON suppliers(district);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ============================================
-- 3. Create supplier_users table (link users to suppliers)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    position VARCHAR(100) DEFAULT 'Owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, supplier_id)
);

-- Create indexes for supplier_users
CREATE INDEX IF NOT EXISTS idx_supplier_users_user_id ON supplier_users(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_users_supplier_id ON supplier_users(supplier_id);

-- ============================================
-- 4. Create commodity_categories table
-- ============================================
CREATE TABLE IF NOT EXISTS commodity_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for commodity_categories
CREATE INDEX IF NOT EXISTS idx_commodity_categories_name ON commodity_categories(name);

-- ============================================
-- 5. Create commodities table
-- ============================================
CREATE TABLE IF NOT EXISTS commodities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES commodity_categories(id) ON DELETE SET NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'kg',
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for commodities
CREATE INDEX IF NOT EXISTS idx_commodities_name ON commodities(name);
CREATE INDEX IF NOT EXISTS idx_commodities_category_id ON commodities(category_id);
CREATE INDEX IF NOT EXISTS idx_commodities_status ON commodities(status);

-- ============================================
-- 6. Create supplier_products table (many-to-many relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    commodity_id UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
    price_per_unit DECIMAL(15, 2) NOT NULL DEFAULT 0,
    stock DECIMAL(15, 2) DEFAULT 0,
    minimum_order DECIMAL(15, 2) DEFAULT 1,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'unavailable', 'out_of_stock')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, commodity_id)
);

-- Create indexes for supplier_products
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_commodity_id ON supplier_products(commodity_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_availability ON supplier_products(availability_status);
CREATE INDEX IF NOT EXISTS idx_supplier_products_price ON supplier_products(price_per_unit);

-- ============================================
-- 7. Create triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commodity_categories_updated_at ON commodity_categories;
CREATE TRIGGER update_commodity_categories_updated_at 
    BEFORE UPDATE ON commodity_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commodities_updated_at ON commodities;
CREATE TRIGGER update_commodities_updated_at 
    BEFORE UPDATE ON commodities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_products_updated_at ON supplier_products;
CREATE TRIGGER update_supplier_products_updated_at 
    BEFORE UPDATE ON supplier_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Insert default commodity categories
-- ============================================
INSERT INTO commodity_categories (name, description) VALUES
    ('Sayuran', 'Sayuran segar seperti kangkung, bayam, wortel, dll'),
    ('Buah-buahan', 'Buah-buahan segar'),
    ('Daging', 'Daging sapi, ayam, kambing, dll'),
    ('Ikan', 'Ikan air tawar dan laut'),
    ('Telur', 'Telur ayam, bebek, puyuh'),
    ('Susu & Olahan', 'Susu dan produk olahan susu'),
    ('Bumbu & Rempah', 'Bumbu dapur dan rempah-rempah'),
    ('Bahan Pokok', 'Beras, minyak goreng, gula, garam, dll'),
    ('Kacang-kacangan', 'Kacang tanah, kacang hijau, kedelai, dll'),
    ('Umbi-umbian', 'Kentang, singkong, ubi, dll')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 9. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
DROP POLICY IF EXISTS suppliers_select_policy ON suppliers;
CREATE POLICY suppliers_select_policy ON suppliers FOR SELECT USING (true);
DROP POLICY IF EXISTS suppliers_insert_policy ON suppliers;
CREATE POLICY suppliers_insert_policy ON suppliers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS suppliers_update_policy ON suppliers;
CREATE POLICY suppliers_update_policy ON suppliers FOR UPDATE USING (true);
DROP POLICY IF EXISTS suppliers_delete_policy ON suppliers;
CREATE POLICY suppliers_delete_policy ON suppliers FOR DELETE USING (true);

-- RLS Policies for supplier_users
DROP POLICY IF EXISTS supplier_users_select_policy ON supplier_users;
CREATE POLICY supplier_users_select_policy ON supplier_users FOR SELECT USING (true);
DROP POLICY IF EXISTS supplier_users_insert_policy ON supplier_users;
CREATE POLICY supplier_users_insert_policy ON supplier_users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS supplier_users_update_policy ON supplier_users;
CREATE POLICY supplier_users_update_policy ON supplier_users FOR UPDATE USING (true);
DROP POLICY IF EXISTS supplier_users_delete_policy ON supplier_users;
CREATE POLICY supplier_users_delete_policy ON supplier_users FOR DELETE USING (true);

-- RLS Policies for commodity_categories
DROP POLICY IF EXISTS commodity_categories_select_policy ON commodity_categories;
CREATE POLICY commodity_categories_select_policy ON commodity_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS commodity_categories_insert_policy ON commodity_categories;
CREATE POLICY commodity_categories_insert_policy ON commodity_categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS commodity_categories_update_policy ON commodity_categories;
CREATE POLICY commodity_categories_update_policy ON commodity_categories FOR UPDATE USING (true);
DROP POLICY IF EXISTS commodity_categories_delete_policy ON commodity_categories;
CREATE POLICY commodity_categories_delete_policy ON commodity_categories FOR DELETE USING (true);

-- RLS Policies for commodities
DROP POLICY IF EXISTS commodities_select_policy ON commodities;
CREATE POLICY commodities_select_policy ON commodities FOR SELECT USING (true);
DROP POLICY IF EXISTS commodities_insert_policy ON commodities;
CREATE POLICY commodities_insert_policy ON commodities FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS commodities_update_policy ON commodities;
CREATE POLICY commodities_update_policy ON commodities FOR UPDATE USING (true);
DROP POLICY IF EXISTS commodities_delete_policy ON commodities;
CREATE POLICY commodities_delete_policy ON commodities FOR DELETE USING (true);

-- RLS Policies for supplier_products
DROP POLICY IF EXISTS supplier_products_select_policy ON supplier_products;
CREATE POLICY supplier_products_select_policy ON supplier_products FOR SELECT USING (true);
DROP POLICY IF EXISTS supplier_products_insert_policy ON supplier_products;
CREATE POLICY supplier_products_insert_policy ON supplier_products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS supplier_products_update_policy ON supplier_products;
CREATE POLICY supplier_products_update_policy ON supplier_products FOR UPDATE USING (true);
DROP POLICY IF EXISTS supplier_products_delete_policy ON supplier_products;
CREATE POLICY supplier_products_delete_policy ON supplier_products FOR DELETE USING (true);

-- ============================================
-- DONE: Supplier Management Tables Created
-- ============================================
