const db = require('../config/db');

class OrderModel {

    static async create(data) {
        const {
            user_id, total_amount, discount_amount, wallet_used, final_amount,
            payment_method, shipping_name, shipping_phone, shipping_address,
            shipping_city, coupon_code, notes
        } = data;

        const [result] = await db.execute(
            `INSERT INTO orders
             (user_id, total_amount, discount_amount, wallet_used, final_amount,
              payment_method, shipping_name, shipping_phone, shipping_address,
              shipping_city, coupon_code, notes)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [user_id, total_amount, discount_amount || 0, wallet_used || 0,
             final_amount, payment_method || 'cod',
             shipping_name, shipping_phone, shipping_address, shipping_city,
             coupon_code || null, notes || null]
        );
        return result.insertId;
    }

    static async insertItems(items) {
        const values = items.map(i =>
            `(${i.order_id}, ${i.product_id}, ${db.escape(i.product_name)},
              ${db.escape(i.product_image)}, ${i.price}, ${i.quantity}, ${i.subtotal})`
        ).join(',');

        await db.query(
            `INSERT INTO order_items
             (order_id, product_id, product_name, product_image, price, quantity, subtotal)
             VALUES ${values}`
        );
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT o.*, u.name AS user_name, u.email AS user_email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findByUser(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async findAll() {
        const [rows] = await db.execute(
            `SELECT o.*, u.name AS user_name, u.email AS user_email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );
        return rows;
    }

    static async getItems(orderId) {
        const [rows] = await db.execute(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [orderId]
        );
        return rows;
    }

    static async updateStatus(id, order_status) {
        await db.execute(
            `UPDATE orders SET order_status = ? WHERE id = ?`,
            [order_status, id]
        );
    }

    static async updatePaymentStatus(id, payment_status) {
        await db.execute(
            `UPDATE orders SET payment_status = ? WHERE id = ?`,
            [payment_status, id]
        );
    }

    static async updateStripeSession(id, stripe_session_id) {
        await db.execute(
            `UPDATE orders SET stripe_session_id = ? WHERE id = ?`,
            [stripe_session_id, id]
        );
    }

    static async findByStripeSession(stripe_session_id) {
        const [rows] = await db.execute(
            `SELECT * FROM orders WHERE stripe_session_id = ?`,
            [stripe_session_id]
        );
        return rows[0];
    }
}

module.exports = OrderModel;
