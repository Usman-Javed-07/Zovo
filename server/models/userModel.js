const db = require("../config/db");

class UserModel {
    static async findByEmail(email) {
        const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute(
            "SELECT id,name,email,image,role,is_verified,is_banned,ban_reason FROM users WHERE id = ?",
            [id]
        );
        return rows[0];
    }

    static async createUser(name, email, password, image, phone) {
        const [result] = await db.execute(
            "INSERT INTO users (name,email,password,image,phone) VALUES (?,?,?,?,?)",
            [name, email, password, image, phone]
        );
        return result.insertId;
    }

    static async markVerified(userId) {
        return db.execute("UPDATE users SET is_verified = TRUE WHERE id = ?", [userId]);
    }

    static async updateProfile(userId, fields) {
        const updates = [];
        const values  = [];
        if (fields.name  !== undefined) { updates.push("name = ?");  values.push(fields.name);  }
        if (fields.image !== undefined) { updates.push("image = ?"); values.push(fields.image); }
        if (updates.length === 0) return;
        values.push(userId);
        return db.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
    }
}

module.exports = UserModel;