/**
 * PostgreSQL Connection Pool
 * Uses pg (node-postgres) for database connections
 */

import { Pool } from 'pg';

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Create and configure connection pool
export const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to PostgreSQL database:', err);
        process.exit(-1);
    }
    console.log('✓ PostgreSQL connected successfully at', res.rows[0].now);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await pool.end();
    console.log('PostgreSQL pool has been closed');
    process.exit(0);
});

export default pool;
