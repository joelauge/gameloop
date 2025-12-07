require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Running migrations...");

        // 1. Users Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        phone_number VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Verified 'users' table.");

        // 2. Friends Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id SERIAL PRIMARY KEY,
        user_phone VARCHAR(20) REFERENCES users(phone_number),
        friend_phone VARCHAR(20),
        friend_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_phone, friend_phone)
      );
    `);
        console.log("Verified 'friends' table.");

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
