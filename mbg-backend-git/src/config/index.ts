import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    url: process.env.DATABASE_URL!,
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiry: process.env.JWT_EXPIRY || '7d',
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    uploadsDir: process.env.UPLOADS_DIR || './uploads',
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3001/uploads',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || '',
    region: process.env.S3_REGION || 'auto',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    bucket: process.env.S3_BUCKET || 'supabase-mbg',
    bucketPrefix: process.env.S3_BUCKET_PREFIX || 'stub/mbg_bucket',
    photoBucketPrefix: process.env.S3_PHOTO_BUCKET_PREFIX || 'stub',
    publicUrl: process.env.S3_PUBLIC_URL || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '120000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '3', 10),
  },

  cronSecret: process.env.CRON_SECRET || '',

  isProduction: process.env.NODE_ENV === 'production',
};
