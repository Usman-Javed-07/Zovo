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
        if (btn.dataset.tab === 'refunds'   && !window._refundsLoaded)   { loadRefunds();   window._refundsLoaded   = true; }
        if (btn.dataset.tab === 'coupons'   && !window._couponsLoaded)   { loadCoupons();   window._couponsLoaded   = true; }
        if (btn.dataset.tab === 'shipments' && !window._shipmentsLoaded) { loadShipments(); window._shipmentsLoaded = true; }
        if (btn.dataset.tab === 'messages'  && !window._messagesLoaded)  { loadMessages();  window._messagesLoaded  = true; }
        if (btn.dataset.tab === 'reviews'   && !window._reviewsLoaded)   { loadReviews();   window._reviewsLoaded   = true; }
        if (btn.dataset.tab === 'products'  && !window._productsLoaded)  { loadAdminProducts(); window._productsLoaded = true; }
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

// ─────────────────────────────────
// MESSAGES TAB
// ─────────────────────────────────
async function loadMessages() {
    const container = document.getElementById('adminMessagesContainer');
    try {
        const res  = await fetch(`${API_BASE_URL}/api/contact/admin`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success || !data.data.length) {
            container.innerHTML = '<p class="loading-text">No messages yet.</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Subject</th><th>Message</th><th>Date</th><th>Reply</th></tr>
                </thead>
                <tbody>
                    ${data.data.map(m => `
                        <tr>
                            <td>#${m.id}</td>
                            <td>${m.name}${m.registered_name ? '<br><small style="color:#5a97f9">Registered</small>' : ''}</td>
                            <td>${m.email}</td>
                            <td>${m.subject}</td>
                            <td class="admin-msg-text">${m.message}</td>
                            <td>${new Date(m.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</td>
                            <td>
                                <button class="btn-sm btn-primary reply-msg-btn" data-id="${m.id}">Reply</button>
                                <div class="reply-form" id="reply-form-${m.id}" style="display:none;margin-top:8px">
                                    <textarea class="reply-textarea" rows="3" placeholder="Type your reply..."></textarea>
                                    <button class="btn-sm btn-approve send-reply-btn" data-id="${m.id}">Send</button>
                                    <span class="reply-status" id="reply-status-${m.id}"></span>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Toggle reply forms
        container.querySelectorAll('.reply-msg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const form = document.getElementById(`reply-form-${btn.dataset.id}`);
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
            });
        });

        // Send reply
        container.querySelectorAll('.send-reply-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id      = btn.dataset.id;
                const form    = document.getElementById(`reply-form-${id}`);
                const reply   = form.querySelector('.reply-textarea').value.trim();
                const status  = document.getElementById(`reply-status-${id}`);
                if (!reply) { status.textContent = 'Reply cannot be empty.'; return; }

                btn.disabled = true;
                const res  = await fetch(`${API_BASE_URL}/api/contact/admin/${id}/reply`, {
                    method:  'POST',
                    headers: authHeaders(),
                    body:    JSON.stringify({ reply })
                });
                const data = await res.json();
                btn.disabled = false;

                if (data.success) {
                    // Fade out and remove the row
                    const row = btn.closest('tr');
                    if (row) {
                        row.style.transition = 'opacity 0.4s ease';
                        row.style.opacity    = '0';
                        setTimeout(() => {
                            row.remove();
                            // Show empty state if no rows left
                            const tbody = container.querySelector('tbody');
                            if (tbody && !tbody.querySelector('tr')) {
                                container.innerHTML = '<p class="loading-text">No messages yet.</p>';
                            }
                        }, 400);
                    }
                } else {
                    status.textContent = data.message || 'Failed to send.';
                    status.style.color = '#f44336';
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// ─────────────────────────────────
// REVIEWS TAB
// ─────────────────────────────────
async function loadReviews() {
    const container = document.getElementById('adminReviewsContainer');
    try {
        const res  = await fetch(`${API_BASE_URL}/api/ratings/admin/all`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success || !data.data.length) {
            container.innerHTML = '<p class="loading-text">No reviews yet.</p>';
            return;
        }

        container.innerHTML = data.data.map(r => {
            const stars   = Array.from({ length: 5 }, (_, i) =>
                `<span class="star${i < r.rating ? ' filled' : ''}">★</span>`
            ).join('');
            const initial = r.user_name ? r.user_name.charAt(0).toUpperCase() : '?';
            const avatar  = r.user_image
                ? `<img class="reviewer-avatar-img" src="${API_BASE_URL}${r.user_image}" alt="${r.user_name}">`
                : `<div class="reviewer-avatar">${initial}</div>`;
            const dt   = new Date(r.updated_at);
            const date = dt.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });

            return `
                <div class="admin-review-card${r.is_hidden ? ' review-hidden' : ''}" data-review-id="${r.id}">
                    ${r.is_hidden ? '<div class="review-hidden-badge">Hidden</div>' : ''}
                    <div class="admin-review-product">
                        <img src="${API_BASE_URL}${r.product_image}" alt="${r.product_name}" class="admin-review-product-img">
                        <div>
                            <span class="admin-review-product-name">${r.product_name}</span>
                            <small>Product #${r.product_id}</small>
                        </div>
                    </div>
                    <div class="admin-review-user">
                        ${avatar}
                        <div>
                            <span class="reviewer-name">${r.user_name}</span>
                            <small>${r.user_email}</small>
                        </div>
                    </div>
                    <div class="star-row">${stars}</div>
                    ${r.feedback ? `<p class="admin-review-feedback">${r.feedback}</p>` : '<p class="admin-review-no-text">No written review</p>'}
                    <span class="admin-review-date">${date}</span>
                    <div class="admin-review-actions">
                        ${r.is_hidden
                            ? `<button class="btn-sm btn-approve unhide-review-btn" data-id="${r.id}">Restore</button>`
                            : `<button class="btn-sm btn-update hide-review-btn" data-id="${r.id}">Hide</button>`
                        }
                        <button class="btn-sm btn-delete delete-review-btn" data-id="${r.id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        // Hide review
        container.querySelectorAll('.hide-review-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Hide this review? The user will be notified.')) return;
                const res  = await fetch(`${API_BASE_URL}/api/ratings/admin/${btn.dataset.id}/hide`, {
                    method: 'PATCH', headers: authHeaders()
                });
                const data = await res.json();
                if (data.success) { window._reviewsLoaded = false; loadReviews(); }
                else alert(data.message);
            });
        });

        // Unhide review
        container.querySelectorAll('.unhide-review-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const res  = await fetch(`${API_BASE_URL}/api/ratings/admin/${btn.dataset.id}/unhide`, {
                    method: 'PATCH', headers: authHeaders()
                });
                const data = await res.json();
                if (data.success) { window._reviewsLoaded = false; loadReviews(); }
                else alert(data.message);
            });
        });

        // Delete review
        container.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Permanently delete this review? The user will be notified.')) return;
                const res  = await fetch(`${API_BASE_URL}/api/ratings/admin/${btn.dataset.id}`, {
                    method: 'DELETE', headers: authHeaders()
                });
                const data = await res.json();
                if (data.success) {
                    document.querySelector(`.admin-review-card[data-review-id="${btn.dataset.id}"]`)?.remove();
                } else alert(data.message);
            });
        });
    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// ─────────────────────────────────
// PRODUCTS TAB
// ─────────────────────────────────
async function loadAdminProducts() {
    const container = document.getElementById('adminProductsContainer');
    try {
        const res  = await fetch(`${API_BASE_URL}/api/products`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.length) {
            container.innerHTML = '<p class="loading-text">No products yet.</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Material</th>
                        <th>Price</th>
                        <th>Rating</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(p => `
                        <tr data-product-id="${p.id}">
                            <td>#${p.id}</td>
                            <td>
                                ${p.image
                                    ? `<img src="${API_BASE_URL}${p.image}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">`
                                    : '<span style="color:#555">—</span>'}
                            </td>
                            <td>${p.name}</td>
                            <td>${p.material || '—'}</td>
                            <td>$${Number(p.price).toFixed(2)}</td>
                            <td>${p.avg_rating > 0 ? '★ ' + p.avg_rating + ' (' + p.rating_count + ')' : '—'}</td>
                            <td class="au-actions">
                                <button class="btn-sm btn-update edit-product-btn" data-id="${p.id}">Edit</button>
                                <button class="btn-sm btn-delete delete-product-btn" data-id="${p.id}" data-name="${p.name}">Delete</button>
                            </td>
                        </tr>
                        <tr class="product-edit-row" id="edit-row-${p.id}" style="display:none;">
                            <td colspan="7">
                                <form class="product-edit-form" data-id="${p.id}" enctype="multipart/form-data">
                                    <div class="form-row" style="flex-wrap:wrap;gap:10px;align-items:flex-end;">
                                        <div class="form-group" style="margin:0;flex:1;min-width:140px;">
                                            <label>Name</label>
                                            <input type="text" name="name" value="${p.name}" required>
                                        </div>
                                        <div class="form-group" style="margin:0;flex:2;min-width:180px;">
                                            <label>Description</label>
                                            <input type="text" name="description" value="${p.description || ''}">
                                        </div>
                                        <div class="form-group" style="margin:0;flex:1;min-width:120px;">
                                            <label>Material</label>
                                            <input type="text" name="material" value="${p.material || ''}">
                                        </div>
                                        <div class="form-group" style="margin:0;width:110px;">
                                            <label>Price ($)</label>
                                            <input type="number" name="price" value="${p.price}" step="0.01" required>
                                        </div>
                                        <div class="form-group" style="margin:0;flex:1;min-width:140px;">
                                            <label>New Image (optional)</label>
                                            <input type="file" name="image" accept="image/*">
                                        </div>
                                        <div style="display:flex;gap:8px;align-items:center;">
                                            <button type="submit" class="btn-sm btn-approve">Save</button>
                                            <button type="button" class="btn-sm cancel-edit-btn" data-id="${p.id}">Cancel</button>
                                            <span class="edit-product-status" id="edit-status-${p.id}"></span>
                                        </div>
                                    </div>
                                </form>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Toggle edit rows
        container.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const editRow = document.getElementById(`edit-row-${btn.dataset.id}`);
                const isOpen  = editRow.style.display !== 'none';
                editRow.style.display = isOpen ? 'none' : 'table-row';
                btn.textContent = isOpen ? 'Edit' : 'Close';
            });
        });

        container.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const editRow = document.getElementById(`edit-row-${btn.dataset.id}`);
                editRow.style.display = 'none';
                const mainRow = container.querySelector(`tr[data-product-id="${btn.dataset.id}"]`);
                mainRow.querySelector('.edit-product-btn').textContent = 'Edit';
            });
        });

        // Submit edit
        container.querySelectorAll('.product-edit-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id     = form.dataset.id;
                const status = document.getElementById(`edit-status-${id}`);
                const formData = new FormData(form);

                const res  = await fetch(`${API_BASE_URL}/api/products/${id}`, {
                    method:  'PUT',
                    headers: { 'Authorization': `Bearer ${_token}` },
                    body:    formData
                });
                const data = await res.json();

                if (data.success) {
                    status.textContent = 'Saved!';
                    status.style.color = '#4caf50';
                    setTimeout(() => {
                        window._productsLoaded = false;
                        loadAdminProducts();
                    }, 800);
                } else {
                    status.textContent = data.message || 'Failed';
                    status.style.color = '#f44336';
                }
            });
        });

        // Delete product
        container.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm(`Delete product "${btn.dataset.name}"? This cannot be undone.`)) return;

                const res  = await fetch(`${API_BASE_URL}/api/products/${btn.dataset.id}`, {
                    method:  'DELETE',
                    headers: authHeaders()
                });
                const data = await res.json();

                if (data.success) {
                    const mainRow = container.querySelector(`tr[data-product-id="${btn.dataset.id}"]`);
                    const editRow = document.getElementById(`edit-row-${btn.dataset.id}`);
                    [mainRow, editRow].forEach(row => {
                        if (row) {
                            row.style.transition = 'opacity 0.3s';
                            row.style.opacity    = '0';
                            setTimeout(() => row.remove(), 300);
                        }
                    });
                } else {
                    alert(data.message);
                }
            });
        });

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

// ── Init: load orders on page load ──
loadOrders();
