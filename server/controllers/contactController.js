const nodemailer        = require('nodemailer');
const ContactModel      = require('../models/contactModel');
const NotificationModel = require('../models/notificationModel');
const db                = require('../config/db');
const templates         = require('../utils/emailTemplates');

async function notifyAdmins(type, title, message) {
    const [admins] = await db.execute("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
        await NotificationModel.create(admin.id, type, title, message);
    }
}

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// ── POST /api/contact ─────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const userId = req.user ? req.user.id : null;
        await ContactModel.save({ userId, name, email, subject, message });

        // Email → admin
        const adminEmail = templates.contactAdminEmail({ name, email, subject, message, userId });
        await transporter.sendMail({
            from:    process.env.SMTP_FROM,
            to:      process.env.SMTP_USER,
            subject: adminEmail.subject,
            html:    adminEmail.html
        });

        // Confirmation email → sender
        const confirmEmail = templates.contactConfirmEmail({ name, subject, message });
        await transporter.sendMail({
            from:    process.env.SMTP_FROM,
            to:      email,
            subject: confirmEmail.subject,
            html:    confirmEmail.html
        });

        // In-app notification to all admins
        await notifyAdmins(
            'new_contact', 'New Contact Message',
            `${name} sent a message: "${subject}"`
        ).catch(() => {});

        return res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('[contactController.sendMessage]', err);
        return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// ── POST /api/contact/admin/:id/reply ────────────────────────────────────────
exports.replyToMessage = async (req, res) => {
    try {
        const msgId = parseInt(req.params.id, 10);
        const { reply } = req.body;
        if (!reply || !reply.trim()) {
            return res.status(400).json({ success: false, message: 'Reply text is required' });
        }

        const msg = await ContactModel.findById(msgId);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

        // Reply email → user
        const replyEmail = templates.contactReplyEmail({
            name:            msg.name,
            subject:         msg.subject,
            originalMessage: msg.message,
            reply:           reply.trim(),
            email:           msg.email
        });
        await transporter.sendMail({
            from:    process.env.SMTP_FROM,
            to:      msg.email,
            subject: replyEmail.subject,
            html:    replyEmail.html
        });

        // In-app notification to user
        if (msg.user_id) {
            await NotificationModel.create(
                msg.user_id, 'contact_reply', 'Admin replied to your message',
                `Your enquiry "${msg.subject}" has been answered. Check your inbox (${msg.email}) for the full reply.`
            );
        }

        // Remove message from DB once replied
        await db.execute('DELETE FROM contact_messages WHERE id = ?', [msgId]);

        return res.json({ success: true, message: 'Reply sent' });
    } catch (err) {
        console.error('[contactController.replyToMessage]', err);
        return res.status(500).json({ success: false, message: 'Failed to send reply' });
    }
};

// ── GET /api/contact/admin ────────────────────────────────────────────────────
exports.getAllMessages = async (_req, res) => {
    try {
        const messages = await ContactModel.getAll();
        return res.json({ success: true, data: messages });
    } catch (err) {
        console.error('[contactController.getAllMessages]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
