import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'aws-0-sa-east-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || `postgres.aqysyawiennfaxcrwcap`,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err.message);
});

export default pool;
