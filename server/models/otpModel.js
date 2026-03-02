const db = require("../config/db");

class OtpModel {
    static async create(userId, otp, expiresAt) {
        return db.execute("INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?,?,?)", [userId, otp, expiresAt]);
    }

    static async findValidOtp(userId, otp) {
        const [rows] = await db.execute(
            `SELECT * FROM otps 
             WHERE user_id = ? 
             AND otp_code = ? 
             AND verified = FALSE 
             AND expires_at > NOW()`,
            [userId, otp]
        );
        return rows[0];
    }

    static async markVerified(id) {
        return db.execute("UPDATE otps SET verified = TRUE WHERE id = ?", [id]);
    }
}

module.exports = OtpModel;