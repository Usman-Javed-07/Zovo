const db                = require('../config/db');
const NotificationModel = require('../models/notificationModel');

/** GET /api/admin/users */
exports.getAllUsers = async (_req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT u.id, u.name, u.email, u.image, u.role, u.is_verified,
                    u.is_banned, u.ban_reason, u.created_at,
                    COUNT(DISTINCT o.id) AS order_count
             FROM   users u
             LEFT   JOIN orders o ON o.user_id = u.id
             GROUP  BY u.id
             ORDER  BY u.created_at DESC`
        );
        return res.json({ success: true, data: users });
    } catch (err) {
        console.error('[adminUserController.getAllUsers]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** PATCH /api/admin/users/:userId/ban */
exports.banUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'Ban reason is required' });
        }
        await db.execute(
            'UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?',
            [reason.trim(), userId]
        );
        await NotificationModel.create(
            userId, 'account_banned', 'Account Suspended',
            `Your account has been suspended. Reason: ${reason.trim()}`
        );
        return res.json({ success: true, message: 'User banned' });
    } catch (err) {
        console.error('[adminUserController.banUser]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** PATCH /api/admin/users/:userId/unban */
exports.unbanUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        await db.execute(
            'UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?',
            [userId]
        );
        await NotificationModel.create(
            userId, 'account_unbanned', 'Account Restored',
            'Your account has been restored. You can now log in again.'
        );
        return res.json({ success: true, message: 'User unbanned' });
    } catch (err) {
        console.error('[adminUserController.unbanUser]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** DELETE /api/admin/users/:userId */
exports.deleteUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        return res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error('[adminUserController.deleteUser]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
