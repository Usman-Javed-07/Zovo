const db = require('../config/db');

class CouponModel {

    static async findByCode(code) {
        const [rows] = await db.execute(
            `SELECT * FROM coupons WHERE code = ? AND is_active = 1`,
            [code.toUpperCase()]
        );
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.execute(
            `SELECT * FROM coupons ORDER BY created_at DESC`
        );
        return rows;
    }

    static async create(data) {
        const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = data;
        const [result] = await db.execute(
            `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
             VALUES (?,?,?,?,?,?)`,
            [code.toUpperCase(), discount_type, discount_value,
             min_order_amount || 0, max_uses || null, expires_at || null]
        );
        return result.insertId;
    }

    static async incrementUsed(couponId) {
        await db.execute(
            `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`,
            [couponId]
        );
    }

    static async hasUserUsed(couponId, userId) {
        const [rows] = await db.execute(
            `SELECT id FROM coupon_usage WHERE coupon_id = ? AND user_id = ?`,
            [couponId, userId]
        );
        return rows.length > 0;
    }

    static async recordUsage(couponId, userId, orderId) {
        await db.execute(
            `INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?,?,?)`,
            [couponId, userId, orderId]
        );
    }

    static async toggleActive(id, is_active) {
        await db.execute(
            `UPDATE coupons SET is_active = ? WHERE id = ?`,
            [is_active, id]
        );
    }

    static async delete(id) {
        await db.execute(`DELETE FROM coupons WHERE id = ?`, [id]);
    }
}

module.exports = CouponModel;
