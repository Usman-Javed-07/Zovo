const db = require('../config/db');

const ContactModel = {
    save: async ({ userId, name, email, subject, message }) => {
        const [result] = await db.execute(
            `INSERT INTO contact_messages (user_id, name, email, subject, message)
             VALUES (?, ?, ?, ?, ?)`,
            [userId || null, name, email, subject, message]
        );
        return result.insertId;
    },

    findById: async (id) => {
        const [[row]] = await db.execute(
            'SELECT id, user_id, name, email, subject, message FROM contact_messages WHERE id = ?',
            [id]
        );
        return row || null;
    },

    getAll: async () => {
        const [rows] = await db.execute(
            `SELECT cm.id, cm.name, cm.email, cm.subject, cm.message, cm.created_at,
                    cm.user_id, u.name AS registered_name
             FROM   contact_messages cm
             LEFT   JOIN users u ON u.id = cm.user_id
             ORDER  BY cm.created_at DESC`
        );
        return rows;
    }
};

module.exports = ContactModel;
