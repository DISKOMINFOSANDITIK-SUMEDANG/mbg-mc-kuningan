# 🍽️ MBG Sumedang - Makan Bergizi Gratis

Aplikasi web modern untuk program "Makan Bergizi Gratis" di Kabupaten Sumedang, Jawa Barat. Aplikasi ini memungkinkan pencarian sekolah, detail SPPG (dapur), menu harian, laporan distribusi, dan sistem manajemen konten (CMS) untuk administrator.

## ✨ Fitur Utama

### 🌐 Landing Page & Public Pages
- **Hero Section** dengan pencarian sekolah real-time
- **Pencarian Lanjutan** dengan filter berdasarkan kecamatan, desa, dan jarak
- **Detail Sekolah** dengan informasi lengkap dan peta interaktif
- **Detail SPPG** dengan data dapur, ahli gizi, dan sertifikat
- **Menu Harian** dengan informasi nutrisi lengkap
- **Data Visualisasi** dengan grafik dan statistik interaktif
- **Halaman Tentang** dan **Kontak**

### 🗺️ Peta Interaktif
- Integrasi dengan **Leaflet** untuk peta interaktif
- Pencarian berdasarkan jarak geografis
- Marker custom dengan Tabler Icons
- Geolocation untuk perhitungan jarak otomatis
- Clustering untuk performa optimal

### 🔐 Sistem Autentikasi & CMS
- **JWT Authentication** dengan 3 level akses:
  - 👨‍💼 **Administrator** - Akses penuh ke semua fitur
  - 🏫 **Sekolah** - Manajemen data sekolah dan laporan
  - 👨‍🍳 **SPPG** - Manajemen data dapur, menu, dan distribusi
- **Dashboard CMS** dengan statistik real-time
- **Manajemen Data** untuk sekolah, SPPG, menu, distribusi, dan pengguna
- **Laporan Harian** dengan upload foto dan verifikasi GPS
- **Export Excel** untuk analisis data

### 📊 Data & Statistik
- **Dashboard Interaktif** dengan grafik real-time
- **Statistik Distribusi** makanan per hari/minggu/bulan
- **Laporan Sekolah** dengan data siswa dan penerima manfaat
- **Visualisasi SPPG** dengan peta sebaran dan grafik
- **Export Data** ke format Excel

### 🎨 UI/UX Modern
- **Responsive Design** untuk semua perangkat
- **Tabler Icons** untuk konsistensi visual
- **Tailwind CSS** untuk styling modern
- **Glass Morphism** dan animasi halus
- **Loading States** dan skeleton screens
- **Toast Notifications** untuk feedback user

## 🚀 Teknologi yang Digunakan

### Frontend
- **Next.js 15** dengan App Router
- **TypeScript** untuk type safety
- **Tailwind CSS** untuk styling
- **Tabler Icons** untuk iconography
- **Leaflet** untuk peta interaktif
- **React Hook Form** untuk form handling
- **Chart.js / Recharts** untuk visualisasi data

### Backend Integration
- **Express.js Backend** (separate repository: `mbg-backend`)
- **PostgreSQL** database
- **JWT** untuk authentication
- **S3-compatible Storage** untuk file uploads
- **RESTful API** architecture

### Development Tools
- **ESLint** untuk code quality
- **TypeScript** untuk type checking
- **Git** untuk version control
- **Vercel** ready untuk deployment

## 📁 Struktur Proyek

```
mbg/
├── app/                          # Next.js App Router
│   ├── api/                     # API Proxy Routes
│   │   └── [...path]/          # Proxy to backend API
│   ├── cms/                    # CMS pages (Protected)
│   │   ├── auth/               # Login & Register
│   │   ├── dashboard/          # Admin dashboard
│   │   ├── schools/            # School management
│   │   ├── sppgs/              # SPPG management
│   │   ├── menus/              # Menu management
│   │   ├── distributions/      # Distribution management
│   │   ├── reports/            # Reports management
│   │   └── users/              # User management
│   ├── data/                   # Public data pages
│   │   ├── sppg/               # SPPG data visualization
│   │   ├── progress/           # Progress tracking
│   │   ├── sudah-melaksanakan/ # Implemented schools
│   │   ├── belum-melaksanakan/ # Not yet implemented
│   │   └── target-sppg/        # SPPG targets
│   ├── schools/[id]/           # School detail pages
│   ├── sppg/[id]/              # SPPG detail pages
│   ├── search/                 # Advanced school search
│   ├── about/                  # About page
│   └── contact/                # Contact page
├── components/                  # React Components
│   ├── cms/                    # CMS components
│   ├── home/                   # Homepage components
│   ├── schools/                # School-related components
│   ├── shared/                 # Shared components
│   │   ├── AppLayout.tsx       # Main layout
│   │   ├── BarChart.tsx        # Chart component
│   │   ├── SPPGMapView.tsx     # Map component
│   │   └── PageSkeletons.tsx   # Loading states
│   └── ui/                     # UI components
├── lib/                        # Utility libraries
│   ├── auth/                   # Authentication utilities
│   ├── api-client.ts           # API client functions
│   ├── api-utils.ts            # API utilities
│   └── utils.ts                # General utilities
├── public/                     # Static assets
│   ├── images/                 # Images
│   └── data/                   # Static data files
├── middleware.ts               # Next.js middleware
└── .env.local                  # Environment variables
```

## 🛠️ Instalasi & Setup

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Backend API running (see `mbg-backend` repository)

### 1. Clone Repository
```bash
git clone <repository-url>
cd mbg
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Buat file `.env.local` di root directory:

```env
# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API
API_URL=http://localhost:3001

# S3 Storage
NEXT_PUBLIC_STORAGE_BASE_URL=https://s3.sumedangkab.go.id
NEXT_PUBLIC_STORAGE_BUCKET=supabase-mbg
NEXT_PUBLIC_STORAGE_BUCKET_PREFIX=stub/mbg_bucket

# JWT Configuration (must match backend)
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
```

### 📝 Catatan Penting

- **NEXT_PUBLIC_BASE_URL**: URL frontend untuk SSR/SSG
- **API_URL**: URL backend API (internal, tidak exposed ke client)
- **NEXT_PUBLIC_STORAGE_BASE_URL**: URL S3 storage untuk akses file
- **JWT_SECRET**: Harus sama dengan backend untuk validasi token
- Semua environment variable dengan prefix `NEXT_PUBLIC_` akan exposed ke browser

### 4. Backend Setup
Pastikan backend API sudah running. Lihat `mbg-backend/README.md` untuk setup backend.

```bash
# Di terminal terpisah, jalankan backend
cd ../mbg-backend
npm run dev
```

### 5. Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## � API Integration

Frontend berkomunikasi dengan backend melalui:

1. **API Proxy** (`/api/[...path]`) - Proxy semua request ke backend
2. **API Client** (`lib/api-client.ts`) - Utility functions untuk API calls
3. **API Utils** (`lib/api-utils.ts`) - Helper functions dan constants

### Contoh API Call

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const schools = await apiClient.get('/schools');

// POST request with auth
const report = await apiClient.post('/reports', {
  school_id: '123',
  date: '2024-01-01',
  portions: 100
});
```

## �📊 Database Schema

Database dikelola oleh backend. Lihat `mbg-backend/README.md` untuk detail schema.

### Tabel Utama
- **schools** - Data sekolah
- **sppgs** - Data SPPG (dapur)
- **menus** - Menu makanan
- **menu_items** - Item menu individual
- **daily_distributions** - Distribusi harian
- **mbg_reports** - Laporan dengan foto
- **users** - Data pengguna
- **foundation** - Data yayasan

## 🔑 Akun Default

Akun default dikelola di backend. Lihat `mbg-backend/README.md` untuk credentials.

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel
   ```

2. **Set Environment Variables** di Vercel Dashboard:
   - `NEXT_PUBLIC_BASE_URL`
   - `API_URL`
   - `NEXT_PUBLIC_STORAGE_BASE_URL`
   - `JWT_SECRET`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

```bash
# Build production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t mbg-frontend .

# Run container
docker run -p 3000:3000 mbg-frontend
```

## 📱 Fitur Mobile

- **Responsive Design** untuk semua screen size
- **Touch-friendly** interface
- **Geolocation** untuk pencarian jarak
- **Progressive Web App** (PWA) ready
- **Offline Support** dengan service worker

## 🔒 Keamanan

- **JWT Authentication** dengan httpOnly cookies
- **Role-based Access Control** (RBAC)
- **CSRF Protection** via SameSite cookies
- **Input Validation** di semua form
- **XSS Protection** dengan sanitization
- **API Proxy** untuk hide backend URL
- **Environment Variables** untuk sensitive data

## 📈 Performance

- **Static Generation** untuk halaman publik
- **Server-Side Rendering** untuk data dinamis
- **Dynamic Imports** untuk code splitting
- **Image Optimization** dengan Next.js Image
- **API Response Caching**
- **Lazy Loading** untuk komponen berat
- **Bundle Size Optimization**

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
tsc --noEmit

# Build test
npm run build
```

## 📚 Dokumentasi

- **Backend API**: `../mbg-backend/README.md`
- **API Endpoints**: `../mbg-backend/README.md#api-documentation`
- **Database Schema**: `../mbg-backend/README.md#database`
- **Deployment Guide**: Lihat section Deployment di atas

## 🎯 Roadmap

- [ ] PWA Implementation
- [ ] Offline Mode
- [ ] Push Notifications
- [ ] Real-time Updates (WebSocket)
- [ ] Advanced Analytics
- [ ] Multi-language Support
- [ ] Dark Mode
- [ ] Mobile App (React Native)

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

### Commit Convention

Gunakan [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Fitur baru
- `fix:` - Bug fix
- `docs:` - Perubahan dokumentasi
- `style:` - Perubahan formatting
- `refactor:` - Refactoring code
- `test:` - Menambah/update tests
- `chore:` - Maintenance tasks

## 📄 Lisensi

Proprietary software untuk Kabupaten Sumedang.

## 🙏 Acknowledgments

- **Tabler Icons** untuk icon set yang konsisten
- **Leaflet** untuk peta interaktif
- **Next.js Team** untuk framework yang powerful
- **Tailwind CSS** untuk utility-first CSS
- **Vercel** untuk hosting platform
- **Kabupaten Sumedang** untuk dukungan program MBG

## 👥 Tim Pengembang

Dikembangkan oleh **Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Sumedang**

## 📞 Support

Untuk pertanyaan dan dukungan:
- Email: diskominfosandi@sumedangkab.go.id
- Website: https://sumedangkab.go.id

---

**Made with ❤️ for Kabupaten Sumedang**