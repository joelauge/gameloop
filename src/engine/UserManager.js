const { Pool } = require('pg');

// Use env var or fallback (fallback likely won't work in prod without setup, but good for local if env set)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

class UserManager {

    async getUser(phoneNumber) {
        try {
            const res = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
            if (res.rows.length > 0) {
                return res.rows[0];
            }
            return null;
        } catch (err) {
            console.error("DB Error getUser:", err);
            return null;
        }
    }

    async createUser(phoneNumber, name) {
        try {
            const res = await pool.query(
                'INSERT INTO users (phone_number, name) VALUES ($1, $2) RETURNING *',
                [phoneNumber, name]
            );
            return res.rows[0];
        } catch (err) {
            console.error("DB Error createUser:", err);
            return null;
        }
    }

    async addFriend(hostNumber, friendName, friendNumber) {
        try {
            // Check if exists to prevent dupe errors if using simple insert
            // The UNIQUE constraint handles it, but let's be safe or use ON CONFLICT
            await pool.query(
                `INSERT INTO friends (user_phone, friend_name, friend_phone) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (user_phone, friend_phone) DO NOTHING`,
                [hostNumber, friendName, friendNumber]
            );
        } catch (err) {
            console.error("DB Error addFriend:", err);
        }
    }

    async getFriendByName(hostNumber, name) {
        try {
            const res = await pool.query(
                'SELECT * FROM friends WHERE user_phone = $1 AND LOWER(friend_name) = LOWER($2)',
                [hostNumber, name]
            );
            if (res.rows.length > 0) {
                return { name: res.rows[0].friend_name, phone: res.rows[0].friend_phone };
            }
            return null;
        } catch (err) {
            console.error("DB Error getFriendByName:", err);
            return null;
        }
    }

    async getFriendListDisplay(hostNumber) {
        try {
            const res = await pool.query('SELECT friend_name FROM friends WHERE user_phone = $1', [hostNumber]);
            if (res.rows.length === 0) return "No saved friends.";
            return res.rows.map(f => f.friend_name).join(', ');
        } catch (err) {
            console.error("DB Error getFriendList:", err);
            return "Error fetching friends.";
        }
    }
}

module.exports = new UserManager();
