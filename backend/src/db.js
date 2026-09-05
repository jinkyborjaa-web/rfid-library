const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const caPath = process.env.DB_CA_CERT_PATH
    ? path.resolve(__dirname, '..', process.env.DB_CA_CERT_PATH)
    : undefined;
let ssl = { rejectUnauthorized: true };

if (caPath) {
    try {
        ssl = { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
        console.log('DB CA certificate loaded:', caPath);
    } catch (error) {
        console.error('DB CA certificate could not be loaded:', caPath);
        console.error(error.message);
    }
}

const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl,
        max: 10
});

async function testConnection() {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected');
    } catch (error) {
        console.error('Database connection failed:', error.message, error.stack);
    }
}

module.exports = { pool, testConnection };