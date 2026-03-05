const NotificationModel = require('../models/notificationModel');

/** GET /api/notifications */
exports.getNotifications = async (req, res) => {
    try {
        const data = await NotificationModel.getForUser(req.user.id);
        return res.json({ success: true, data });
    } catch (err) {
        console.error('[notificationController.getNotifications]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** GET /api/notifications/unread-count */
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await NotificationModel.getUnreadCount(req.user.id);
        return res.json({ success: true, count });
    } catch (err) {
        console.error('[notificationController.getUnreadCount]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** PATCH /api/notifications/read-all */
exports.markAllRead = async (req, res) => {
    try {
        await NotificationModel.markAllRead(req.user.id);
        return res.json({ success: true });
    } catch (err) {
        console.error('[notificationController.markAllRead]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
