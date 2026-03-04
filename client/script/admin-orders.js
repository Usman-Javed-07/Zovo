// ── Admin guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user || _user.role !== 'admin') {
    window.location.href = './index.html';
}

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${_token}`
});

// ── Tab switching ──
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

        // Lazy load on first click
        if (btn.dataset.tab === 'refunds' && !window._refundsLoaded)  { loadRefunds();   window._refundsLoaded  = true; }
        if (btn.dataset.tab === 'coupons' && !window._couponsLoaded)  { loadCoupons();   window._couponsLoaded  = true; }
        if (btn.dataset.tab === 'shipments' && !window._shipmentsLoaded) { loadShipments(); window._shipmentsLoaded = true; }
    });
});

// ─────────────────────────────────
// ORDERS TAB
// ─────────────────────────────────
async function loadOrders() {
    const container = document.getElementById('adminOrdersContainer');
    try {
        const res    = await fetch(`${API_BASE_URL}/api/orders`, { headers: authHeaders() });
        const orders = await res.json();

        if (!orders.length) { container.innerHTML = '<p class="loading-text">No orders yet.</p>'; return; }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th><th>Customer</th><th>Amount</th>
                        <th>Payment</th><th>Status</th><th>Date</th><th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td>#${o.id}</td>
                            <td>${o.user_name}<br><small style="color:#666">${o.user_email}</small></td>
                            <td>$${Number(o.final_amount).toFixed(2)}</td>
                            <td>
                                <span class="badge badge-${o.payment_status}">${o.payment_status}</span>
                                <br><small style="color:#666">${o.payment_method}</small>
                            </td>
                            <td>
                                <select class="status-select" data-order-id="${o.id}">
                                    ${['processing','confirmed','shipped','delivered','cancelled'].map(s =>
                                        `<option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>`
                                    ).join('')}
                                </select>
                            </td>
                            <td>${new Date(o.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn-sm btn-update save-status-btn" data-order-id="${o.id}">Save</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Save status
        container.querySelectorAll('.save-status-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id     = btn.dataset.orderId;
                const select = container.querySelector(`.status-select[data-order-id="${id}"]`);
                const status = select.value;

                const res  = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
                    method: 'PATCH',
                    headers: authHeaders(),
                    body: JSON.stringify({ order_status: status })
                });
                const data = await res.json();
                if (data.success) {
                    btn.textContent = 'Saved!';
                    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// ─────────────────────────────────
// REFUNDS TAB
// ─────────────────────────────────
async function loadRefunds() {
    const container = document.getElementById('adminRefundsContainer');
    try {
        const res     = await fetch(`${API_BASE_URL}/api/refunds`, { headers: authHeaders() });
        const refunds = await res.json();

        if (!refunds.length) { container.innerHTML = '<p class="loading-text">No refund requests.</p>'; return; }

        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>#</th><th>Customer</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Reason</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${refunds.map(r => `
                        <tr>
                            <td>#${r.id}</td>
                            <td>${r.user_name}</td>
                            <td>#${r.order_id}</td>
                            <td>$${Number(r.amount).toFixed(2)}</td>
                            <td>${r.refund_method}</td>
                            <td><span class="badge badge-${r.status}">${r.status}</span></td>
                            <td>${r.reason || '—'}</td>
                            <td>
                                ${r.status === 'pending' ? `
                                    <button class="btn-sm btn-approve" data-id="${r.id}" data-action="approved">Approve</button>
                                    <button class="btn-sm btn-reject"  data-id="${r.id}" data-action="rejected">Reject</button>
                                ` : '—'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id     = btn.dataset.id;
                const status = btn.dataset.action;
                const note   = status === 'rejected' ? prompt('Rejection reason:') : '';

                const res  = await fetch(`${API_BASE_URL}/api/refunds/${id}`, {
                    method: 'PATCH',
                    headers: authHeaders(),
                    body: JSON.stringify({ status, admin_notes: note })
                });
                const data = await res.json();
                if (data.success) loadRefunds();
                else alert(data.message);
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// ─────────────────────────────────
// COUPONS TAB
// ─────────────────────────────────
async function loadCoupons() {
    const container = document.getElementById('adminCouponsContainer');
    try {
        const res     = await fetch(`${API_BASE_URL}/api/coupons`, { headers: authHeaders() });
        const coupons = await res.json();

        if (!coupons.length) { container.innerHTML = '<p class="loading-text">No coupons yet.</p>'; return; }

        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${coupons.map(c => `
                        <tr>
                            <td><strong>${c.code}</strong></td>
                            <td>${c.discount_type}</td>
                            <td>${c.discount_type === 'percentage' ? c.discount_value + '%' : '$' + c.discount_value}</td>
                            <td>$${Number(c.min_order_amount).toFixed(2)}</td>
                            <td>${c.used_count}${c.max_uses ? '/' + c.max_uses : ''}</td>
                            <td>${c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                            <td><span class="badge ${c.is_active ? 'badge-active' : 'badge-inactive'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
                            <td>
                                <button class="btn-sm btn-toggle" data-id="${c.id}" data-active="${c.is_active ? 0 : 1}">
                                    ${c.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button class="btn-sm btn-delete del-coupon" data-id="${c.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', async () => {
                await fetch(`${API_BASE_URL}/api/coupons/${btn.dataset.id}/toggle`, {
                    method: 'PATCH', headers: authHeaders(),
                    body: JSON.stringify({ is_active: Number(btn.dataset.active) })
                });
                loadCoupons();
            });
        });

        container.querySelectorAll('.del-coupon').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this coupon?')) return;
                await fetch(`${API_BASE_URL}/api/coupons/${btn.dataset.id}`, {
                    method: 'DELETE', headers: authHeaders()
                });
                loadCoupons();
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// Create coupon form
document.getElementById('couponForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('couponCreateMsg');

    const body = {
        code:             document.getElementById('cp_code').value.trim(),
        discount_type:    document.getElementById('cp_type').value,
        discount_value:   parseFloat(document.getElementById('cp_value').value),
        min_order_amount: parseFloat(document.getElementById('cp_min').value || 0),
        max_uses:         parseInt(document.getElementById('cp_max_uses').value) || null,
        expires_at:       document.getElementById('cp_expires').value || null
    };

    const res  = await fetch(`${API_BASE_URL}/api/coupons`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
        msg.textContent = 'Coupon created!';
        msg.className   = 'coupon-msg success';
        e.target.reset();
        loadCoupons();
    } else {
        msg.textContent = data.message;
        msg.className   = 'coupon-msg error';
    }
});

// ─────────────────────────────────
// SHIPMENTS TAB
// ─────────────────────────────────
async function loadShipments() {
    const container = document.getElementById('adminShipmentsContainer');
    try {
        const res       = await fetch(`${API_BASE_URL}/api/shipments`, { headers: authHeaders() });
        const shipments = await res.json();

        if (!shipments.length) { container.innerHTML = '<p class="loading-text">No shipments yet.</p>'; return; }

        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>Order</th><th>Customer</th><th>Courier</th><th>Tracking</th><th>Status</th><th>Est. Delivery</th><th>Update</th></tr>
                </thead>
                <tbody>
                    ${shipments.map(s => `
                        <tr>
                            <td>#${s.order_id}</td>
                            <td>${s.user_name}<br><small>${s.shipping_city}</small></td>
                            <td>${s.courier_name || '—'}</td>
                            <td>${s.tracking_number || '—'}</td>
                            <td>
                                <select class="status-select ship-status" data-order-id="${s.order_id}">
                                    ${['pending','picked_up','in_transit','delivered','returned'].map(st =>
                                        `<option value="${st}" ${s.status === st ? 'selected' : ''}>${st}</option>`
                                    ).join('')}
                                </select>
                            </td>
                            <td>${s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : '—'}</td>
                            <td>
                                <button class="btn-sm btn-update save-ship-btn" data-order-id="${s.order_id}">Save</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.querySelectorAll('.save-ship-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const orderId = btn.dataset.orderId;
                const status  = container.querySelector(`.ship-status[data-order-id="${orderId}"]`).value;

                const res  = await fetch(`${API_BASE_URL}/api/shipments/order/${orderId}`, {
                    method: 'PATCH', headers: authHeaders(),
                    body: JSON.stringify({ status })
                });
                const data = await res.json();
                if (data.success) {
                    btn.textContent = 'Saved!';
                    setTimeout(() => { btn.textContent = 'Save'; }, 1500);
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// Create shipment form
document.getElementById('shipmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('shipmentMsg');

    const body = {
        order_id:          parseInt(document.getElementById('sh_order_id').value),
        courier_name:      document.getElementById('sh_courier').value.trim(),
        tracking_number:   document.getElementById('sh_tracking').value.trim(),
        estimated_delivery: document.getElementById('sh_delivery').value || null
    };

    const res  = await fetch(`${API_BASE_URL}/api/shipments`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
        msg.textContent = 'Shipment created & order marked as shipped!';
        msg.className   = 'shipment-msg success';
        e.target.reset();
        loadShipments();
    } else {
        msg.textContent = data.message;
        msg.className   = 'shipment-msg error';
    }
});

// ── Init: load orders on page load ──
loadOrders();
