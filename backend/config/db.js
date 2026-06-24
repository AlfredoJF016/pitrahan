const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Database connection configuration.
 * 
 * Supports two modes:
 * 1. DATABASE_URL (Railway, PlanetScale, Aiven) — used in production (Vercel)
 * 2. Individual DB_* env vars — used in local development
 */

let poolConfig;

if (process.env.DATABASE_URL) {
    // Production: Parse connection URL (e.g., from Railway or PlanetScale)
    // Format: mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
    poolConfig = {
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        // Railway requires SSL in production
        ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
    };
} else {
    // Local development: Use individual environment variables
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pitrahan',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };
}

// Create connection pool
const pool = mysql.createPool(poolConfig);

// Helper for testing connection
async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully.');
        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
}

module.exports = {
    pool,
    checkConnection
};
