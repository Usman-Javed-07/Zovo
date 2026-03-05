const db = require('../config/db');

const NotificationModel = {
    create: async (userId, type, title, message) => {
        await db.execute(
            'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
            [userId, type, title, message]
        );
    },

    getForUser: async (userId, limit = 20) => {
        const [rows] = await db.execute(
            `SELECT id, type, title, message, is_read, created_at
             FROM   notifications
             WHERE  user_id = ?
             ORDER  BY created_at DESC
             LIMIT  ?`,
            [userId, limit]
        );
        return rows;
    },

    getUnreadCount: async (userId) => {
        const [[row]] = await db.execute(
            'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return row.count;
    },

    markAllRead: async (userId) => {
        await db.execute(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            [userId]
        );
    }
};

module.exports = NotificationModel;
