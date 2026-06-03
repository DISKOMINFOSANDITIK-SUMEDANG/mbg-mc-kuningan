import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.poolSize,
  idleTimeoutMillis: config.database.idleTimeout,
  connectionTimeoutMillis: config.database.connectionTimeout,
  ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = {
  query: async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    const start = Date.now();
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (config.nodeEnv === 'development' && duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
      }
      return result;
    } catch (error: any) {
      // Retry once on connection errors (stale pool connections)
      if (error?.message?.includes('Connection terminated')) {
        console.warn('Connection terminated, retrying query...');
        try {
          const result = await pool.query<T>(text, params);
          return result;
        } catch (retryError) {
          console.error('Database query error (retry failed):', { text: text.substring(0, 200), error: retryError });
          throw retryError;
        }
      }
      console.error('Database query error:', { text: text.substring(0, 200), error });
      throw error;
    }
  },

  getClient: async () => {
    const client = await pool.connect();
    return client;
  },

  pool,
};

export default db;

export const query = db.query;
