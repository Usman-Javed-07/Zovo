const db = require('../config/db');

class ShipmentModel {

    static async create(data) {
        const { order_id, courier_name, tracking_number, estimated_delivery, notes } = data;
        const [result] = await db.execute(
            `INSERT INTO shipments (order_id, courier_name, tracking_number, estimated_delivery, notes)
             VALUES (?,?,?,?,?)`,
            [order_id, courier_name || null, tracking_number || null,
             estimated_delivery || null, notes || null]
        );
        return result.insertId;
    }

    static async findByOrder(orderId) {
        const [rows] = await db.execute(
            `SELECT s.*, o.order_status, o.shipping_name, o.shipping_address, o.shipping_city
             FROM shipments s
             JOIN orders o ON s.order_id = o.id
             WHERE s.order_id = ?`,
            [orderId]
        );
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.execute(
            `SELECT s.*, o.shipping_name, o.shipping_city, o.order_status, u.name AS user_name
             FROM shipments s
             JOIN orders o ON s.order_id = o.id
             JOIN users u ON o.user_id = u.id
             ORDER BY s.created_at DESC`
        );
        return rows;
    }

    static async updateStatus(orderId, status, tracking_number, notes) {
        await db.execute(
            `UPDATE shipments SET status = ?, tracking_number = COALESCE(?, tracking_number),
             notes = COALESCE(?, notes)
             WHERE order_id = ?`,
            [status, tracking_number || null, notes || null, orderId]
        );
    }

    static async update(orderId, data) {
        const { courier_name, tracking_number, status, estimated_delivery, notes } = data;
        await db.execute(
            `UPDATE shipments
             SET courier_name = COALESCE(?, courier_name),
                 tracking_number = COALESCE(?, tracking_number),
                 status = COALESCE(?, status),
                 estimated_delivery = COALESCE(?, estimated_delivery),
                 notes = COALESCE(?, notes)
             WHERE order_id = ?`,
            [courier_name || null, tracking_number || null, status || null,
             estimated_delivery || null, notes || null, orderId]
        );
    }
}

module.exports = ShipmentModel;
