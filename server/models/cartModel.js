const db = require("../config/db");

class CartModel {

    static async findItem(userId, productId) {
        const [rows] = await db.execute(
            "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        );
        return rows[0];
    }

    static async createItem(userId, productId) {
        return db.execute(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)",
            [userId, productId]
        );
    }

    static async increaseQuantity(userId, productId) {
        return db.execute(
            "UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        );
    }

    static async updateQuantity(userId, productId, quantity) {
        return db.execute(
            "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
            [quantity, userId, productId]
        );
    }

    static async removeItem(userId, productId) {
        return db.execute(
            "DELETE FROM cart WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        );
    }

    static async getCart(userId) {
        const [rows] = await db.execute(`
            SELECT 
                p.id,
                p.name,
                p.price,
                p.image,
                c.quantity
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [userId]);

        return rows;
    }

static async getCartCount(userId) {
    const [rows] = await db.execute(
        "SELECT COUNT(*) as total FROM cart WHERE user_id = ?",
        [userId]
    );

    return rows[0].total || 0;
}
}

module.exports = CartModel;