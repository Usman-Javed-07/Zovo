const db = require("../config/db");

class RefreshTokenModel {
    static async create(userId, token, expiresAt) {
        return db.execute(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)",
            [userId, token, expiresAt]
        );
    }

    static async find(token) {
        const [rows] = await db.execute("SELECT * FROM refresh_tokens WHERE token = ?", [token]);
        return rows[0];
    }

    static async delete(token) {
        return db.execute("DELETE FROM refresh_tokens WHERE token = ?", [token]);
    }
}

module.exports = RefreshTokenModel;