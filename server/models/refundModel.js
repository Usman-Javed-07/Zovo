const db = require('../config/db');

class RefundModel {

    static async create(data) {
        const { order_id, user_id, amount, reason, refund_method } = data;
        const [result] = await db.execute(
            `INSERT INTO refunds (order_id, user_id, amount, reason, refund_method)
             VALUES (?,?,?,?,?)`,
            [order_id, user_id, amount, reason || null, refund_method || 'wallet']
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT r.*, o.stripe_session_id, o.payment_method,
                    u.name AS user_name, u.email AS user_email
             FROM refunds r
             JOIN orders o ON r.order_id = o.id
             JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByUser(userId) {
        const [rows] = await db.execute(
            `SELECT r.*, o.order_status, o.payment_method
             FROM refunds r
             JOIN orders o ON r.order_id = o.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async findAll() {
        const [rows] = await db.execute(
            `SELECT r.*, u.name AS user_name, u.email AS user_email,
                    o.payment_method, o.stripe_session_id
             FROM refunds r
             JOIN users u ON r.user_id = u.id
             JOIN orders o ON r.order_id = o.id
             ORDER BY r.created_at DESC`
        );
        return rows;
    }

    static async updateStatus(id, status, admin_notes, stripe_refund_id) {
        await db.execute(
            `UPDATE refunds SET status = ?, admin_notes = ?, stripe_refund_id = ? WHERE id = ?`,
            [status, admin_notes || null, stripe_refund_id || null, id]
        );
    }

    static async findByOrder(orderId) {
        const [rows] = await db.execute(
            `SELECT * FROM refunds WHERE order_id = ?`,
            [orderId]
        );
        return rows[0];
    }
}

module.exports = RefundModel;
