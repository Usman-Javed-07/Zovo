// ── Auth guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user) {
    window.location.href = './login.html';
}

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${_token}`
});

// ── Submit refund request ──
document.getElementById('refundForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('refundMsg');
    msg.textContent = '';

    const body = {
        order_id:      parseInt(document.getElementById('refund_order_id').value),
        amount:        parseFloat(document.getElementById('refund_amount').value),
        reason:        document.getElementById('refund_reason').value.trim(),
        refund_method: document.getElementById('refund_method').value
    };

    try {
        const res  = await fetch(`${API_BASE_URL}/api/refunds`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        msg.textContent = 'Refund request submitted successfully!';
        msg.className   = 'refund-msg success';
        e.target.reset();
        loadRefunds();
    } catch (err) {
        msg.textContent = err.message;
        msg.className   = 'refund-msg error';
    }
});

// ── Load my refunds ──
async function loadRefunds() {
    const container = document.getElementById('refundsContainer');
    try {
        const res     = await fetch(`${API_BASE_URL}/api/refunds/my`, {
            headers: { 'Authorization': `Bearer ${_token}` }
        });
        const refunds = await res.json();

        if (!refunds.length) {
            container.innerHTML = '<p class="loading-text">No refund requests yet.</p>';
            return;
        }

        container.innerHTML = refunds.map(r => `
            <div class="refund-item">
                <div class="refund-item-info">
                    <p>Order: <span>#${r.order_id}</span></p>
                    <p>Amount: <span>$${Number(r.amount).toFixed(2)}</span></p>
                    <p>Method: <span>${r.refund_method.toUpperCase()}</span></p>
                    <p>Reason: <span>${r.reason || '—'}</span></p>
                    <p>Date: <span>${new Date(r.created_at).toLocaleDateString()}</span></p>
                    ${r.admin_notes ? `<p>Admin Note: <span>${r.admin_notes}</span></p>` : ''}
                </div>
                <span class="refund-badge ${r.status}">${r.status.toUpperCase()}</span>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// Pre-fill order ID from query string
const params = new URLSearchParams(window.location.search);
if (params.get('orderId')) {
    document.getElementById('refund_order_id').value = params.get('orderId');
}

loadRefunds();
