/* ──────────────────────────────────────────────────────────────
   contact.js — Contact form pre-fill + submission
   ────────────────────────────────────────────────────────────── */

(function () {
    const nameInput    = document.getElementById('contactName');
    const emailInput   = document.getElementById('contactEmail');
    const subjectInput = document.getElementById('contactSubject');
    const msgTextarea  = document.getElementById('contactMessage');
    const form         = document.getElementById('contactForm');
    const submitBtn    = document.getElementById('contactSubmitBtn');
    const formMsg      = document.getElementById('contactFormMsg');

    // ── Pre-fill logged-in user's name and email (read-only) ──
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            if (user.name)  { nameInput.value  = user.name;  nameInput.readOnly  = true; }
            if (user.email) { emailInput.value = user.email; emailInput.readOnly = true; }
        }
    } catch (_) {}

    // ── Form submission ──
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name    = nameInput.value.trim();
        const email   = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = msgTextarea.value.trim();

        if (!name || !email || !subject || !message) {
            showMsg('Please fill in all fields.', false);
            return;
        }

        submitBtn.disabled    = true;
        submitBtn.textContent = 'Sending...';
        formMsg.textContent   = '';

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res  = await fetch(`${API_BASE_URL}/api/contact`, {
                method:      'POST',
                headers,
                credentials: 'include',
                body:        JSON.stringify({ name, email, subject, message })
            });
            const data = await res.json();

            if (data.success) {
                showMsg('Message sent successfully! We\'ll get back to you soon.', true);
                subjectInput.value = '';
                msgTextarea.value  = '';
            } else {
                showMsg(data.message || 'Failed to send message.', false);
            }
        } catch (err) {
            console.error('[contact submit]', err);
            showMsg('Something went wrong. Please try again.', false);
        } finally {
            submitBtn.disabled    = false;
            submitBtn.textContent = 'Send Message';
        }
    });

    function showMsg(text, success) {
        formMsg.textContent  = text;
        formMsg.className    = 'contact-form-msg ' + (success ? 'contact-form-msg--success' : 'contact-form-msg--error');
    }
})();
