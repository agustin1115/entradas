import dns from 'dns';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  lookup: (hostname, _options, callback) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) return callback(err);
      callback(null, addresses[0], 4);
    });
  },
});

pool.on('error', (err) => {
  console.error('Unexpected DB error:', err.message);
});

export default pool;
