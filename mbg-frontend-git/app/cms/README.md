# CMS - Makan Bergizi Gratis

Content Management System untuk program Makan Bergizi Gratis di Kabupaten Kuningan.

## 🏗️ Struktur Folder

```
app/cms/
├── auth/                    # Halaman autentikasi
│   ├── login/              # Halaman login
├── dashboard/              # Dashboard utama
├── schools/                # Kelola sekolah
├── sppgs/                  # Kelola SPPG
├── menus/                  # Kelola menu
└── users/                  # Kelola users

components/cms/
├── auth/                   # Komponen autentikasi
├── layout/                 # Layout CMS
│   └── CMSLayout.tsx      # Layout utama CMS
└── forms/                  # Form components

lib/auth/
├── jwt.ts                 # JWT utilities
└── auth.ts                # Authentication functions
```

## 🔐 Sistem Autentikasi

### User Roles

1. **Administrator**
   - Akses penuh ke semua fitur
   - Dapat mengelola users, sekolah, SPPG, dan menu
   - Dashboard dengan statistik lengkap

2. **Sekolah**
   - Mengelola data sekolah sendiri
   - Melihat dan mengelola menu harian
   - Tidak dapat akses data SPPG

3. **SPPG**
   - Mengelola data SPPG sendiri
   - Mengelola menu harian
   - Tidak dapat akses data sekolah

### Authentication Flow

1. **Login** (`/cms/auth/login`)
   - Email dan password
   - JWT token generation
   - Role-based redirect

2. **Middleware Protection**
   - Route protection dengan JWT
   - Role-based access control
   - Automatic redirect to login

## 🎨 Layout CMS

### Sidebar Navigation
- **Dashboard**: Statistik dan overview
- **Sekolah**: Kelola data sekolah (admin + sekolah)
- **SPPG**: Kelola data SPPG (admin + SPPG)
- **Menu**: Kelola menu harian (semua role)
- **Users**: Kelola users (admin only)

### Top Bar
- Search functionality
- Notifications
- User profile dropdown
- Logout button

### Responsive Design
- Mobile-first approach
- Collapsible sidebar
- Touch-friendly interface

## 🚀 Fitur yang Tersedia

### ✅ Implemented
- [x] User authentication (JWT)
- [x] Role-based access control
- [x] Login page
- [x] CMS Layout dengan sidebar
- [x] Dashboard dengan statistik
- [x] Placeholder pages untuk semua modul
- [x] Middleware protection
- [x] Database schema untuk auth

### 🔄 In Development
- [ ] CRUD operations untuk sekolah
- [ ] CRUD operations untuk SPPG
- [ ] Menu management system
- [ ] User management
- [ ] File upload untuk foto/dokumen
- [ ] Real-time notifications
- [ ] Reporting system

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: JWT, bcryptjs
- **Database**: Supabase (PostgreSQL)
- **Icons**: Tabler Icons
- **State Management**: React hooks

## 🔧 Setup Instructions

### 1. Environment Variables
```bash
# Add to .env.local
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Setup
```sql
-- Run auth schema migration
-- Run auth data seeder
```

### 3. Test Accounts
```
Administrator:
Email: admin@kuningankab.go.id
Password: password123

Sekolah:
Email: sekolah@sirahcai.sch.id
Password: password123

SPPG:
Email: sppg@sirahcai.go.id
Password: password123
```

## 📱 Pages Overview

### `/cms/auth/login`
- Login form dengan email/password
- Remember me functionality
- Error handling
- Redirect based on role

### `/cms/dashboard`
- Welcome message
- Statistics cards
- Recent activities
- Quick actions
- System status

### `/cms/schools`
- School management (placeholder)
- Filters and search
- CRUD operations (coming soon)

### `/cms/sppgs`
- SPPG management (placeholder)
- Filters and search
- CRUD operations (coming soon)

### `/cms/menus`
- Menu management (placeholder)
- Daily menu planning
- Nutrition information (coming soon)

### `/cms/users`
- User management (admin only)
- Role management
- User statistics (coming soon)

## 🔒 Security Features

- JWT token authentication
- Password hashing dengan bcrypt
- Role-based access control
- Route protection middleware
- Input validation
- XSS protection

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `role` (ENUM: administrator, sekolah, sppg)
- `is_active` (BOOLEAN)
- `last_login` (TIMESTAMP)

### User Profiles Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `full_name` (VARCHAR)
- `phone` (VARCHAR)
- `avatar_url` (TEXT)

### School Users Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `school_id` (UUID, Foreign Key)
- `position` (VARCHAR)

### SPPG Users Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `sppg_id` (UUID, Foreign Key)
- `position` (VARCHAR)

## 🎯 Next Steps

1. **Implement CRUD Operations**
   - School management
   - SPPG management
   - Menu management
   - User management

2. **Add Advanced Features**
   - File upload
   - Real-time updates
   - Reporting dashboard
   - Email notifications

3. **Enhance UI/UX**
   - Data tables dengan pagination
   - Advanced filters
   - Bulk operations
   - Export functionality

4. **Add Testing**
   - Unit tests
   - Integration tests
   - E2E tests

## 🐛 Known Issues

- Password hashing menggunakan placeholder (perlu implementasi bcrypt)
- Token refresh belum diimplementasi
- Error handling masih basic
- Loading states perlu improvement

## 📞 Support

Untuk pertanyaan atau bantuan, silakan hubungi tim development.
