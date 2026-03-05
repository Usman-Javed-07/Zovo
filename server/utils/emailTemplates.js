// ── Base layout helpers ───────────────────────────────────────────────────────

function emailWrapper(content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Zovo</title>
</head>
<body style="margin:0;padding:0;background:#0f1210;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1210;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#1a1f1b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2a1f,#0d1a14);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07);">
              <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:3px;color:#e3e3e3;">ZOVO</h1>
              <p style="margin:6px 0 0;font-size:12px;color:#5a97f9;letter-spacing:2px;text-transform:uppercase;">Fashion &amp; Style</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111614;padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#555;">© ${new Date().getFullYear()} Zovo. All rights reserved.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#444;">123 Fashion Ave, New York, NY 10001</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function h2(text) {
    return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#e3e3e3;">${text}</h2>`;
}

function p(text) {
    return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#aaa;">${text}</p>`;
}

function divider() {
    return `<div style="border-top:1px solid rgba(255,255,255,0.07);margin:24px 0;"></div>`;
}

function messageBox(text) {
    return `<div style="background:#111614;border-left:3px solid #5a97f9;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:#ccc;white-space:pre-wrap;">${text}</p>
    </div>`;
}

function badge(label, color) {
    return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}55;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:600;">${label}</span>`;
}

function safe(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Exported email builders ───────────────────────────────────────────────────

/**
 * Email sent to admin when a user submits a contact form message.
 */
exports.contactAdminEmail = ({ name, email, subject, message, userId }) => ({
    subject: `[Zovo Contact] ${subject}`,
    html: emailWrapper(`
        ${h2('New Contact Message')}
        ${p('You have received a new message from the contact form.')}
        ${divider()}
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
            <tr>
                <td style="padding:6px 0;font-size:13px;color:#666;width:100px;">From</td>
                <td style="padding:6px 0;font-size:14px;color:#e3e3e3;font-weight:600;">${safe(name)}</td>
            </tr>
            <tr>
                <td style="padding:6px 0;font-size:13px;color:#666;">Email</td>
                <td style="padding:6px 0;font-size:14px;color:#5a97f9;"><a href="mailto:${safe(email)}" style="color:#5a97f9;text-decoration:none;">${safe(email)}</a></td>
            </tr>
            <tr>
                <td style="padding:6px 0;font-size:13px;color:#666;">Subject</td>
                <td style="padding:6px 0;font-size:14px;color:#e3e3e3;">${safe(subject)}</td>
            </tr>
            <tr>
                <td style="padding:6px 0;font-size:13px;color:#666;">User</td>
                <td style="padding:6px 0;">${userId ? badge('Registered', '#5a97f9') : badge('Guest', '#888')}</td>
            </tr>
        </table>
        ${divider()}
        <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;">Message</p>
        ${messageBox(safe(message))}
    `)
});

/**
 * Confirmation email sent to the user after they submit a contact form message.
 */
exports.contactConfirmEmail = ({ name, subject, message }) => ({
    subject: 'We received your message — Zovo',
    html: emailWrapper(`
        ${h2(`Hi ${safe(name)},`)}
        ${p('Thank you for reaching out to us! We have received your message and our team will get back to you within <strong style="color:#e3e3e3;">24 hours</strong>.')}
        ${divider()}
        <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;">Your Message</p>
        <p style="margin:0 0 4px;font-size:13px;color:#5a97f9;font-weight:600;">${safe(subject)}</p>
        ${messageBox(safe(message))}
        ${divider()}
        ${p('In the meantime, feel free to browse our latest collection.')}
        <div style="text-align:center;margin-top:8px;">
            <a href="https://zovo.com/products" style="display:inline-block;background:#5a97f9;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">Browse Collection</a>
        </div>
    `)
});

/**
 * Reply email sent to the user when admin responds to their contact message.
 */
exports.contactReplyEmail = ({ name, subject, originalMessage, reply, email }) => ({
    subject: `Re: ${subject} — Zovo`,
    html: emailWrapper(`
        ${h2(`Hi ${safe(name)},`)}
        ${p('Thank you for contacting Zovo. Our team has reviewed your message and here is our response:')}
        ${divider()}
        <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;">Our Reply</p>
        ${messageBox(safe(reply))}
        ${divider()}
        <p style="margin:0 0 8px;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:1px;">Your Original Message</p>
        <p style="margin:0 0 4px;font-size:13px;color:#666;font-weight:600;">${safe(subject)}</p>
        <div style="background:#0f1210;border-radius:8px;padding:14px 18px;margin-top:6px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#555;white-space:pre-wrap;">${safe(originalMessage)}</p>
        </div>
        ${divider()}
        ${p(`If you have any further questions, feel free to reply to this email or visit us at <a href="https://zovo.com/contact" style="color:#5a97f9;text-decoration:none;">zovo.com/contact</a>.`)}
    `)
});
