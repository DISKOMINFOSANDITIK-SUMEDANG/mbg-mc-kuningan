-- Seed data for Makan Bergizi Gratis Program
-- Based on mock data from lib/data.ts

-- Insert SPPGs
INSERT INTO sppgs (id, name, type, capacity, location, latitude, longitude, phone, email, address, operating_hours_start, operating_hours_end, kitchen_photo_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dapur Satelit Modular Sirah Cai', 'Dapur Satelit Modular', 600, 'Kecamatan Sirah Cai, Sumedang', -6.8333, 107.9167, '+62-261-123456', 'dapur.sirahcai@sumedangkab.go.id', 'Jl. Raya Sirah Cai No. 123, Sumedang', '06:00:00', '14:00:00', 'https://placehold.co/800x600/4F46E5/FFFFFF/png?text=Dapur+Satelit+Modular+Sirah+Cai'),
('550e8400-e29b-41d4-a716-446655440002', 'Dapur Pusat Tanjungsari', 'Dapur Pusat', 1000, 'Kecamatan Tanjungsari, Sumedang', -6.8500, 107.9000, '+62-261-234567', 'dapur.tanjungsari@sumedangkab.go.id', 'Jl. Raya Tanjungsari No. 456, Sumedang', '05:00:00', '15:00:00', 'https://placehold.co/800x600/7C3AED/FFFFFF/png?text=Dapur+Pusat+Tanjungsari');

-- Insert Schools
INSERT INTO schools (id, name, level, address, district, village, sppg_id, student_count, program_start_date, status, latitude, longitude) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'SDN Sirah Cai', 'SD', 'Jl. Pendidikan No. 1, Sirah Cai, Sumedang', 'Sirah Cai', 'Sirah Cai', '550e8400-e29b-41d4-a716-446655440001', 250, '2024-11-18', 'Active', -6.8333, 107.9167),
('550e8400-e29b-41d4-a716-446655440012', 'SDN Sirah Cai 2', 'SD', 'Jl. Merdeka No. 15, Sirah Cai, Sumedang', 'Sirah Cai', 'Sirah Cai', '550e8400-e29b-41d4-a716-446655440001', 180, '2024-11-18', 'Active', -6.8350, 107.9180),
('550e8400-e29b-41d4-a716-446655440013', 'SDN Tanjungsari 1', 'SD', 'Jl. Pendidikan No. 10, Tanjungsari, Sumedang', 'Tanjungsari', 'Tanjungsari', '550e8400-e29b-41d4-a716-446655440002', 320, '2025-02-17', 'Active', -6.8500, 107.9000),
('550e8400-e29b-41d4-a716-446655440014', 'SDN Tanjungsari 2', 'SD', 'Jl. Kartini No. 5, Tanjungsari, Sumedang', 'Tanjungsari', 'Tanjungsari', '550e8400-e29b-41d4-a716-446655440002', 280, '2025-02-17', 'Active', -6.8480, 107.9020),
('550e8400-e29b-41d4-a716-446655440015', 'SMPN 1 Tanjungsari', 'SMP', 'Jl. Pahlawan No. 20, Tanjungsari, Sumedang', 'Tanjungsari', 'Tanjungsari', '550e8400-e29b-41d4-a716-446655440002', 400, '2025-02-17', 'Active', -6.8520, 107.8980);

-- Insert Nutritionists
INSERT INTO nutritionists (id, sppg_id, name, qualification, experience, photo_url) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'Dr. Siti Nurhaliza, S.Gz, M.Gizi', 'Magister Gizi Klinik', '8 tahun pengalaman di bidang gizi sekolah', 'https://placehold.co/200x200/10B981/FFFFFF/png?text=Dr.+Siti+Nurhaliza'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'Prof. Dr. Ahmad Wijaya, S.Gz, M.Sc, Ph.D', 'Doktor Ilmu Gizi', '12 tahun pengalaman di bidang gizi masyarakat', 'https://placehold.co/200x200/059669/FFFFFF/png?text=Prof.+Dr.+Ahmad+Wijaya');

-- Insert SLHS Certificates
INSERT INTO slhs_certificates (id, sppg_id, certificate_number, file_url, issue_date, expiry_date) VALUES
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', 'SLHS/SUMEDANG/2024/001', 'https://placehold.co/800x600/DC2626/FFFFFF/pdf?text=Sertifikat+Laik+Higiene+Sanitasi', '2024-01-15', '2025-01-15'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', 'SLHS/SUMEDANG/2024/002', 'https://placehold.co/800x600/DC2626/FFFFFF/pdf?text=Sertifikat+Laik+Higiene+Sanitasi', '2024-02-01', '2025-02-01');

-- Insert SPPG Facilities
INSERT INTO sppg_facilities (id, sppg_id, facility_name) VALUES
-- SPPG 1 facilities
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', 'Kompor gas industri'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440001', 'Rice cooker besar'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440001', 'Kulkas penyimpanan'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440001', 'Area cuci piring'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440001', 'Sistem ventilasi'),
-- SPPG 2 facilities
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440002', 'Dapur industri lengkap'),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440002', 'Sistem pendingin'),
('550e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440002', 'Area distribusi'),
('550e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440002', 'Kendaraan pengantar'),
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440002', 'Sistem monitoring');

-- Insert Menu Items
INSERT INTO menu_items (id, name, description, calories, protein, carbs, fat, image_url) VALUES
('550e8400-e29b-41d4-a716-446655440061', 'Nasi Putih', 'Nasi putih berkualitas tinggi', 200, 4.00, 45.00, 0.50, '/images/nasi-putih.jpg'),
('550e8400-e29b-41d4-a716-446655440062', 'Ayam Goreng', 'Ayam goreng dengan bumbu tradisional', 250, 25.00, 2.00, 15.00, '/images/ayam-goreng.jpg'),
('550e8400-e29b-41d4-a716-446655440063', 'Sayur Bayam', 'Sayur bayam segar dengan bumbu ringan', 30, 3.00, 5.00, 0.50, '/images/sayur-bayam.jpg'),
('550e8400-e29b-41d4-a716-446655440064', 'Buah Apel', 'Buah apel segar sebagai pencuci mulut', 80, 0.30, 21.00, 0.20, '/images/apel.jpg'),
('550e8400-e29b-41d4-a716-446655440065', 'Tempe Bacem', 'Tempe bacem dengan bumbu Jawa', 150, 12.00, 15.00, 6.00, '/images/tempe-bacem.jpg'),
('550e8400-e29b-41d4-a716-446655440066', 'Sop Sayuran', 'Sop sayuran segar dengan kaldu alami', 60, 2.00, 8.00, 1.00, '/images/sop-sayuran.jpg');

-- Insert Menu Item Allergens
INSERT INTO menu_item_allergens (id, menu_item_id, allergen_name) VALUES
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440065', 'Kedelai');

-- Insert Daily Menus
INSERT INTO daily_menus (id, sppg_id, menu_date, total_calories, notes) VALUES
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 560, 'Menu khusus hari ini dengan fokus protein tinggi'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + INTERVAL '1 day', 470, 'Menu vegetarian-friendly untuk besok'),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 560, 'Menu standar untuk semua sekolah di Tanjungsari'),
('550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + INTERVAL '2 days', 470, 'Menu bervariasi untuk hari Rabu');

-- Insert Daily Menu Items
INSERT INTO daily_menu_items (id, daily_menu_id, menu_item_id) VALUES
-- Daily Menu 1 (SPPG 1 - Today)
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440061'),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440062'),
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440063'),
('550e8400-e29b-41d4-a716-446655440094', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440064'),
-- Daily Menu 2 (SPPG 1 - Tomorrow)
('550e8400-e29b-41d4-a716-446655440095', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440061'),
('550e8400-e29b-41d4-a716-446655440096', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440065'),
('550e8400-e29b-41d4-a716-446655440097', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440066'),
('550e8400-e29b-41d4-a716-446655440098', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440064'),
-- Daily Menu 3 (SPPG 2 - Today)
('550e8400-e29b-41d4-a716-446655440099', '550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440061'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440062'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440063'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440064'),
-- Daily Menu 4 (SPPG 2 - Day after tomorrow)
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440061'),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440065'),
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440066'),
('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440084', '550e8400-e29b-41d4-a716-446655440064');
