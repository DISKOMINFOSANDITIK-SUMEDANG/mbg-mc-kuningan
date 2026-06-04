# Database Schema - Makan Bergizi Gratis

Database schema untuk program Makan Bergizi Gratis di Kabupaten Kuningan yang telah dinormalisasi dari mock data.

## 📊 Database Structure

### Core Tables

#### 1. **sppgs** (Dapur SPPG)
- `id` (UUID, Primary Key)
- `name` (VARCHAR) - Nama dapur
- `type` (VARCHAR) - Jenis dapur: 'Dapur Satelit Modular', 'Dapur Konvensional', 'Dapur Pusat'
- `capacity` (INTEGER) - Kapasitas maksimal porsi per hari
- `location` (VARCHAR) - Lokasi dapur
- `latitude`, `longitude` (DECIMAL) - Koordinat GPS
- `phone`, `email`, `address` - Kontak dapur
- `operating_hours_start`, `operating_hours_end` (TIME) - Jam operasional
- `kitchen_photo_url` (TEXT) - URL foto dapur
- `is_active` (BOOLEAN) - Status dapur aktif/nonaktif

#### 2. **schools** (Sekolah)
- `id` (UUID, Primary Key)
- `name` (VARCHAR) - Nama sekolah
- `level` (VARCHAR) - Tingkat: 'SD', 'SMP', 'SMA', 'SMK'
- `address` (TEXT) - Alamat lengkap
- `district` (VARCHAR) - Kecamatan
- `village` (VARCHAR) - Desa/Kelurahan
- `sppg_id` (UUID, Foreign Key) - Referensi ke sppgs
- `student_count` (INTEGER) - Jumlah siswa
- `program_start_date` (DATE) - Tanggal mulai program
- `status` (VARCHAR) - Status: 'Active', 'Inactive', 'Pilot'
- `latitude`, `longitude` (DECIMAL) - Koordinat GPS

#### 3. **nutritionists** (Ahli Gizi)
- `id` (UUID, Primary Key)
- `sppg_id` (UUID, Foreign Key) - Referensi ke sppgs
- `name` (VARCHAR) - Nama ahli gizi
- `qualification` (VARCHAR) - Kualifikasi pendidikan
- `experience` (TEXT) - Pengalaman kerja
- `photo_url` (TEXT) - URL foto ahli gizi

#### 4. **slhs_certificates** (Sertifikat Laik Higiene Sanitasi)
- `id` (UUID, Primary Key)
- `sppg_id` (UUID, Foreign Key) - Referensi ke sppgs
- `certificate_number` (VARCHAR, Unique) - Nomor sertifikat
- `file_url` (TEXT) - URL file sertifikat PDF
- `issue_date`, `expiry_date` (DATE) - Tanggal terbit dan kadaluarsa

### Menu & Nutrition Tables

#### 5. **menu_items** (Item Menu)
- `id` (UUID, Primary Key)
- `name` (VARCHAR) - Nama menu
- `description` (TEXT) - Deskripsi menu
- `calories` (INTEGER) - Kalori per porsi
- `protein`, `carbs`, `fat` (DECIMAL) - Kandungan nutrisi
- `image_url` (TEXT) - URL gambar menu

#### 6. **menu_item_allergens** (Alergen Menu)
- `id` (UUID, Primary Key)
- `menu_item_id` (UUID, Foreign Key) - Referensi ke menu_items
- `allergen_name` (VARCHAR) - Nama alergen

#### 7. **daily_menus** (Menu Harian)
- `id` (UUID, Primary Key)
- `sppg_id` (UUID, Foreign Key) - Referensi ke sppgs
- `menu_date` (DATE) - Tanggal menu
- `total_calories` (INTEGER) - Total kalori harian
- `notes` (TEXT) - Catatan khusus
- **Unique constraint**: `(sppg_id, menu_date)`

#### 8. **daily_menu_items** (Item Menu Harian)
- `id` (UUID, Primary Key)
- `daily_menu_id` (UUID, Foreign Key) - Referensi ke daily_menus
- `menu_item_id` (UUID, Foreign Key) - Referensi ke menu_items
- **Unique constraint**: `(daily_menu_id, menu_item_id)`

### Supporting Tables

#### 9. **sppg_facilities** (Fasilitas Dapur)
- `id` (UUID, Primary Key)
- `sppg_id` (UUID, Foreign Key) - Referensi ke sppgs
- `facility_name` (VARCHAR) - Nama fasilitas

## 🔗 Relationships

```
sppgs (1) ──→ (N) schools
sppgs (1) ──→ (N) nutritionists
sppgs (1) ──→ (N) slhs_certificates
sppgs (1) ──→ (N) sppg_facilities
sppgs (1) ──→ (N) daily_menus

menu_items (1) ──→ (N) menu_item_allergens
menu_items (N) ──→ (N) daily_menus (through daily_menu_items)
```

## 📈 Indexes

Database telah dioptimasi dengan indexes untuk performa query:

- `idx_schools_sppg_id` - Query sekolah berdasarkan SPPG
- `idx_schools_district` - Filter sekolah berdasarkan kecamatan
- `idx_schools_village` - Filter sekolah berdasarkan desa
- `idx_schools_status` - Filter sekolah berdasarkan status
- `idx_daily_menus_sppg_id` - Query menu harian berdasarkan SPPG
- `idx_daily_menus_date` - Query menu berdasarkan tanggal
- Dan indexes lainnya untuk foreign keys

## 🚀 Setup Instructions

### 1. Environment Variables
```bash
# Copy environment file
cp env.example .env.local

# Update with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migration
Schema sudah diimport ke Supabase menggunakan MCP. Jika perlu re-import:

```sql
-- Run schema.sql to create tables
-- Run seed.sql to populate with sample data
```

### 3. Data Verification
```sql
-- Check data counts
SELECT 'sppgs' as table_name, COUNT(*) as count FROM sppgs
UNION ALL
SELECT 'schools', COUNT(*) FROM schools
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL
SELECT 'daily_menus', COUNT(*) FROM daily_menus;
```

## 📊 Sample Data

Database telah diisi dengan data sample:

- **2 SPPGs** (Dapur Satelit Modular Sirah Cai, Dapur Pusat Tanjungsari)
- **5 Schools** (SDN Sirah Cai, SDN Sirah Cai 2, SDN Tanjungsari 1, SDN Tanjungsari 2, SMPN 1 Tanjungsari)
- **6 Menu Items** (Nasi Putih, Ayam Goreng, Sayur Bayam, Buah Apel, Tempe Bacem, Sop Sayuran)
- **4 Daily Menus** (Hari ini, besok, lusa untuk 2 SPPG)
- **2 Nutritionists** (Dr. Siti Nurhaliza, Prof. Dr. Ahmad Wijaya)
- **2 SLHS Certificates** (Sertifikat higiene sanitasi)
- **10 Facilities** (Fasilitas dapur untuk 2 SPPG)

## 🔧 API Functions

File `lib/supabase-data.ts` menyediakan fungsi-fungsi untuk mengakses data:

- `getSchools()` - Ambil semua sekolah
- `getSPPGs()` - Ambil semua SPPG
- `getSchoolById(id)` - Ambil sekolah berdasarkan ID
- `getSPPGById(id)` - Ambil SPPG berdasarkan ID
- `searchSchools(query)` - Cari sekolah
- `searchSPPGs(query)` - Cari SPPG
- `getSchoolsByDistrict(district)` - Filter sekolah berdasarkan kecamatan
- `getSchoolsByVillage(village)` - Filter sekolah berdasarkan desa
- `getSPPGsByType(type)` - Filter SPPG berdasarkan jenis
- `getSPPGsByLocation(location)` - Filter SPPG berdasarkan lokasi

## 🎯 Next Steps

1. **Update Application**: Ganti import dari `lib/data.ts` ke `lib/supabase-data.ts`
2. **Add RLS Policies**: Implementasi Row Level Security untuk keamanan
3. **Add Authentication**: Integrasi dengan Supabase Auth
4. **Add Real-time**: Gunakan Supabase Realtime untuk update live
5. **Add File Storage**: Upload foto dan dokumen ke Supabase Storage
