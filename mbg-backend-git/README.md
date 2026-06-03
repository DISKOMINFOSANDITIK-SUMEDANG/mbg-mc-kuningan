# MBG Backend API

Backend API for **Makan Bergizi Gratis (MBG)** - Free Nutritious Meals Program for Kabupaten Sumedang.

Built with **Express.js**, **TypeScript**, and **PostgreSQL**.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database](#database)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)

---

## ✨ Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **User Management** - School accounts, SPPG accounts, and admin roles
- 🏫 **School Management** - CRUD operations for schools and student data
- 🍽️ **SPPG Management** - Sentra Pangan Pendidikan Gizi (Kitchen Centers)
- 📊 **Reports & Statistics** - Daily meal distribution reports with photos
- 📱 **Mobile API** - Dedicated endpoints for mobile app integration
- 🗺️ **Geolocation** - GPS tracking for meal distribution verification
- 📦 **S3 Storage** - File uploads (photos, documents) to S3-compatible storage
- 🛡️ **Security** - Helmet, CORS, rate limiting, input sanitization
- 📈 **Excel Export** - Generate Excel reports for data analysis
- 🔄 **Real-time Data** - Live statistics and dashboard data

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **File Storage**: AWS S3 SDK (S3-compatible storage)
- **Security**: Helmet, CORS, express-rate-limit
- **File Upload**: Multer
- **Excel Generation**: ExcelJS
- **Password Hashing**: bcryptjs
- **Development**: Nodemon, TSX

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **npm** or **yarn**
- **PostgreSQL** >= 14.x
- **Git**

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd mbg-backend
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Copy the example environment file and configure it:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual credentials (see [Configuration](#configuration) section).

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
DB_POOL_SIZE=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d

# File Storage
STORAGE_TYPE=s3
UPLOADS_DIR=./uploads
STORAGE_BASE_URL=http://localhost:3001/uploads

# S3 Storage
S3_ENDPOINT=https://your-s3-endpoint.com
S3_REGION=auto
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_BUCKET_PREFIX=your-prefix
S3_PHOTO_BUCKET_PREFIX=your-photo-prefix
S3_PUBLIC_URL=https://your-s3-public-url.com
S3_FORCE_PATH_STYLE=true

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=120000
RATE_LIMIT_MAX_REQUESTS=1000

# Cron Secret
CRON_SECRET=your-cron-secret-key
```

### Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE db_mbg;
```

2. Run migrations (if available):

```bash
npm run migrate
```

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot-reload enabled.

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

#### Schools
- `GET /api/schools` - List all schools
- `GET /api/schools/:id` - Get school details
- `POST /api/schools` - Create new school (admin only)
- `PUT /api/schools/:id` - Update school (admin only)
- `DELETE /api/schools/:id` - Delete school (admin only)

#### SPPGs (Kitchen Centers)
- `GET /api/sppgs` - List all SPPGs
- `GET /api/sppgs/:id` - Get SPPG details
- `GET /api/sppgs/:id/schools` - Get schools served by SPPG
- `GET /api/sppgs/:id/reports` - Get SPPG reports
- `GET /api/sppgs/:id/distributions` - Get distribution history

#### Reports
- `GET /api/reports` - List all reports
- `POST /api/reports` - Create new report (mobile app)
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

#### Statistics
- `GET /api/statistics/dashboard` - Dashboard statistics
- `GET /api/statistics/schools` - School statistics
- `GET /api/statistics/sppgs` - SPPG statistics
- `GET /api/statistics/distributions` - Distribution statistics

#### Menus
- `GET /api/menus` - List all menus
- `GET /api/menus/:id` - Get menu details
- `POST /api/menus` - Create new menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu

#### Distributions
- `GET /api/distributions` - List distributions
- `POST /api/distributions` - Create distribution record
- `GET /api/distributions/:id` - Get distribution details

#### File Upload
- `POST /api/upload/photo` - Upload photo
- `POST /api/upload/document` - Upload document
- `POST /api/upload/avatar` - Upload user avatar

#### Contact
- `POST /api/contact` - Submit contact form

---

## 📁 Project Structure

```
mbg-backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── index.ts
│   ├── controllers/      # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── schools.controller.ts
│   │   ├── sppgs.controller.ts
│   │   ├── reports.controller.ts
│   │   ├── statistics.controller.ts
│   │   ├── menus.controller.ts
│   │   ├── distributions.controller.ts
│   │   ├── upload.controller.ts
│   │   └── ...
│   ├── db/               # Database related
│   │   ├── pool.ts       # PostgreSQL connection pool
│   │   ├── migrations/   # Database migrations
│   │   ├── seed/         # Seed data
│   │   ├── functions/    # SQL functions
│   │   └── triggers/     # SQL triggers
│   ├── lib/              # External libraries
│   │   └── s3.ts         # S3 client configuration
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── upload.ts     # File upload handling
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── schools.routes.ts
│   │   ├── sppgs.routes.ts
│   │   ├── reports.routes.ts
│   │   ├── statistics.routes.ts
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── schools.service.ts
│   │   ├── sppgs.service.ts
│   │   ├── reports.service.ts
│   │   └── ...
│   ├── types/            # TypeScript types
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── pagination.ts
│   │   ├── response.ts
│   │   └── ...
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── dist/                 # Compiled JavaScript (generated)
├── uploads/              # Local file uploads (development)
├── .env                  # Production environment variables
├── .env.local            # Local environment variables (gitignored)
├── .gitignore
├── nodemon.json          # Nodemon configuration
├── package.json
├── tsconfig.json         # TypeScript configuration
└── README.md
```

---

## 🗄️ Database

### Schema Overview

Main tables:
- `users` - User accounts (schools, SPPGs, admins)
- `schools` - School information
- `sppgs` - SPPG (Kitchen Center) information
- `foundation` - Foundation/Yayasan data
- `menus` - Menu items and recipes
- `menu_items` - Individual food items
- `menu_details` - Menu composition
- `daily_distributions` - Daily meal distribution records
- `mbg_reports` - Mobile app reports with photos
- `sppg_kitchen_photos` - SPPG kitchen photos
- `nutritionists` - Nutritionist information
- `slhs_certificates` - Health certificates
- `sppg_facilities` - SPPG facilities
- `groups` - School groupings
- `bahan_baku` - Raw materials/ingredients
- `sppg_products` - SPPG products

### Migrations

Run database migrations:

```bash
npm run migrate
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong `JWT_SECRET` (minimum 32 characters)
- [ ] Configure production database credentials
- [ ] Set up S3 storage credentials
- [ ] Configure CORS for production frontend URL
- [ ] Enable rate limiting (adjust limits as needed)
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up process manager (PM2)
- [ ] Configure logging and monitoring
- [ ] Set up automated backups for database

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start dist/server.js --name mbg-backend

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

---

## 🔒 Security

### Implemented Security Measures

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Cross-origin resource sharing control
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **Input Sanitization** - Prevent XSS attacks
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **Token Blacklist** - Logout token invalidation
- ✅ **Environment Variables** - Sensitive data protection

### Security Best Practices

1. **Never commit `.env` or `.env.local` files**
2. **Use strong, unique passwords** for database and JWT secrets
3. **Regularly update dependencies** to patch vulnerabilities
4. **Enable HTTPS** in production
5. **Implement proper error handling** (don't expose stack traces)
6. **Use prepared statements** for all database queries
7. **Validate and sanitize** all user inputs
8. **Implement proper access control** (role-based permissions)

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 📝 License

This project is proprietary software for Kabupaten Sumedang.

---

## 👥 Team

Developed for **Kabupaten Sumedang** - Makan Bergizi Gratis Program

---

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

## 🔄 Changelog

### Version 1.0.0 (Current)
- Initial release
- Core API functionality
- Authentication system
- School and SPPG management
- Report submission system
- Statistics and dashboard
- Mobile app integration

---

**Made with ❤️ for Kabupaten Sumedang**
