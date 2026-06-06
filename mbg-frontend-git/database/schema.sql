-- Database Schema for Makan Bergizi Gratis Program
-- Normalized from mock data in lib/data.ts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SPPG (Dapur) Table
CREATE TABLE sppgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL CHECK (type IN ('Dapur Satelit Modular', 'Dapur Konvensional', 'Dapur Pusat')),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    operating_hours_start TIME NOT NULL,
    operating_hours_end TIME NOT NULL,
    kitchen_photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools Table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    level VARCHAR(10) NOT NULL CHECK (level IN ('SD', 'SMP', 'SMA', 'SMK')),
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    sppg_id UUID NOT NULL REFERENCES sppgs(id) ON DELETE CASCADE,
    student_count INTEGER NOT NULL CHECK (student_count > 0),
    program_start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Pilot')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutritionists Table
CREATE TABLE nutritionists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sppg_id UUID NOT NULL REFERENCES sppgs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLHS Certificates Table
CREATE TABLE slhs_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sppg_id UUID NOT NULL REFERENCES sppgs(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    file_url TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SPPG Facilities Table (Many-to-Many)
CREATE TABLE sppg_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sppg_id UUID NOT NULL REFERENCES sppgs(id) ON DELETE CASCADE,
    facility_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items Table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calories INTEGER,
    protein DECIMAL(5, 2),
    carbs DECIMAL(5, 2),
    fat DECIMAL(5, 2),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Item Allergens Table (Many-to-Many)
CREATE TABLE menu_item_allergens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    allergen_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Menus Table
CREATE TABLE daily_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sppg_id UUID NOT NULL REFERENCES sppgs(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL,
    total_calories INTEGER NOT NULL CHECK (total_calories >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sppg_id, menu_date)
);

-- Daily Menu Items Table (Many-to-Many)
CREATE TABLE daily_menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(daily_menu_id, menu_item_id)
);

-- Create indexes for better performance
CREATE INDEX idx_schools_sppg_id ON schools(sppg_id);
CREATE INDEX idx_schools_district ON schools(district);
CREATE INDEX idx_schools_village ON schools(village);
CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_nutritionists_sppg_id ON nutritionists(sppg_id);
CREATE INDEX idx_slhs_certificates_sppg_id ON slhs_certificates(sppg_id);
CREATE INDEX idx_sppg_facilities_sppg_id ON sppg_facilities(sppg_id);
CREATE INDEX idx_menu_item_allergens_menu_item_id ON menu_item_allergens(menu_item_id);
CREATE INDEX idx_daily_menus_sppg_id ON daily_menus(sppg_id);
CREATE INDEX idx_daily_menus_date ON daily_menus(menu_date);
CREATE INDEX idx_daily_menu_items_daily_menu_id ON daily_menu_items(daily_menu_id);
CREATE INDEX idx_daily_menu_items_menu_item_id ON daily_menu_items(menu_item_id);
CREATE INDEX idx_sppgs_is_active ON sppgs(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sppgs_updated_at BEFORE UPDATE ON sppgs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutritionists_updated_at BEFORE UPDATE ON nutritionists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slhs_certificates_updated_at BEFORE UPDATE ON slhs_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_menus_updated_at BEFORE UPDATE ON daily_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
