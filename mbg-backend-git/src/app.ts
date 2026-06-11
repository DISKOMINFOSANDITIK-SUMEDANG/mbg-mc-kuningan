import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

// Public (non-CMS) routes
import authRoutes from './routes/auth.routes';
import schoolsRoutes from './routes/schools.routes';
import sppgsRoutes from './routes/sppgs.routes';
import menusRoutes from './routes/menus.routes';
import distributionsRoutes from './routes/distributions.routes';
import groupsRoutes from './routes/groups.routes';
import bahanBakuRoutes from './routes/bahanBaku.routes';
import contactRoutes from './routes/contact.routes';
import statisticsRoutes from './routes/statistics.routes';
import reportsRoutes from './routes/reports.routes';
import uploadRoutes from './routes/upload.routes';
import sppgProductsRoutes from './routes/sppgProducts.routes';
import offtakerRoutes from './routes/offtaker.routes';

// CMS routes
import cmsAuthRoutes from './routes/cms/auth.routes';
import cmsUsersRoutes from './routes/cms/users.routes';
import cmsSchoolsRoutes from './routes/cms/schools.routes';
import cmsSppgsRoutes from './routes/cms/sppgs.routes';
import cmsMenusRoutes from './routes/cms/menus.routes';
import cmsDistributionsRoutes from './routes/cms/distributions.routes';
import cmsGroupsRoutes from './routes/cms/groups.routes';
import cmsFoundationsRoutes from './routes/cms/foundations.routes';
import cmsCommoditiesRoutes from './routes/cms/commodities.routes';
import cmsCommodityCategoriesRoutes from './routes/cms/commodity-categories.routes';
import cmsSuppliersRoutes from './routes/cms/suppliers.routes';
import cmsSupplierProductsRoutes from './routes/cms/supplier-products.routes';
import cmsOfftakersRoutes from './routes/cms/offtakers.routes';
import cmsOfftakerProductsRoutes from './routes/cms/offtaker-products.routes';
import cmsTransactionsRoutes from './routes/cms/transactions.routes';
import cmsStockRoutes from './routes/cms/stock.routes';
import cmsReportsRoutes from './routes/cms/reports.routes';
import cmsSettingsRoutes from './routes/cms/settings.routes';

const app = express();

// Trust the first proxy (nginx/aaPanel) so req.ip returns the real client IP
// This is required for per-IP rate limiting to work correctly behind a reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const configuredOrigins = config.cors.origin
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  'https://mbg.sumedangkab.go.id',
  ...configuredOrigins,
  ...(config.nodeEnv !== 'production' ? ['http://localhost:3000', 'http://localhost:3001', 'http://10.0.2.2:3001'] : []),
];

app.use(cors({
  origin: function(origin, callback) {
    // Requests from server-side rendering, reverse proxies, health checks, curl, or
    // Postman may not include Origin. CORS only applies to browser-origin requests.
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cron-Secret'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiRateLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.resolve(config.storage.uploadsDir)));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Forgot password (public, no /auth prefix - matches Android app endpoint)
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email harus diisi' });
    // Always return success to prevent email enumeration
    return res.json({ message: 'Jika email terdaftar, instruksi reset password telah dikirim.' });
  } catch {
    return res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

// ============ Public API routes ============
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolsRoutes);
app.use('/api/sppgs', sppgsRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/distributions', distributionsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/bahan-baku', bahanBakuRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', uploadRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sppg-products', sppgProductsRoutes);
app.use('/api/offtaker', offtakerRoutes);

// ============ CMS API routes ============
app.use('/api/cms/auth', cmsAuthRoutes);
app.use('/api/cms/users', cmsUsersRoutes);
app.use('/api/cms/schools', cmsSchoolsRoutes);
app.use('/api/cms/sppgs', cmsSppgsRoutes);
app.use('/api/cms/menus', cmsMenusRoutes);
app.use('/api/cms/distributions', cmsDistributionsRoutes);
app.use('/api/cms/groups', cmsGroupsRoutes);
app.use('/api/cms/foundations', cmsFoundationsRoutes);
app.use('/api/cms/commodities', cmsCommoditiesRoutes);
app.use('/api/cms/commodity-categories', cmsCommodityCategoriesRoutes);
app.use('/api/cms/suppliers', cmsSuppliersRoutes);
app.use('/api/cms/supplier-products', cmsSupplierProductsRoutes);
app.use('/api/cms/offtakers', cmsOfftakersRoutes);
app.use('/api/cms/offtaker-products', cmsOfftakerProductsRoutes);
app.use('/api/cms/transactions', cmsTransactionsRoutes);
app.use('/api/cms/stock', cmsStockRoutes);
app.use('/api/cms/reports', cmsReportsRoutes);
app.use('/api/cms/settings', cmsSettingsRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
