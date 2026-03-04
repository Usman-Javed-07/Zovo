// ── Auth guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user) {
    window.location.href = './login.html';
}

const authHeaders = {
    'Authorization': `Bearer ${_token}`
};

const STATUS_LABELS = {
    processing: 'Processing',
    confirmed:  'Confirmed',
    shipped:    'Shipped',
    delivered:  'Delivered',
    cancelled:  'Cancelled'
};

const PAYMENT_LABELS = {
    pending:  'Pending',
    paid:     'Paid',
    failed:   'Failed',
    refunded: 'Refunded'
};

async function loadOrders() {
    const container = document.getElementById('ordersContainer');

    // Check for success param from Stripe redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
        container.innerHTML = '<p style="color:#4caf50;text-align:center;padding:1rem">Payment successful! Your order is being processed.</p>';
    }

    try {
        const res    = await fetch(`${API_BASE_URL}/api/orders/my`, { headers: authHeaders });
        const orders = await res.json();

        if (!orders.length) {
            container.innerHTML = '<p class="loading-text">No orders yet. <a href="./products.html" style="color:#5a97f9">Start shopping!</a></p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-card-header">
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
                    <div class="order-badges">
                        <span class="badge badge-status-${order.order_status}">${STATUS_LABELS[order.order_status] || order.order_status}</span>
                        <span class="badge badge-payment-${order.payment_status}">${PAYMENT_LABELS[order.payment_status] || order.payment_status}</span>
                        <span class="badge badge-method">${order.payment_method.toUpperCase()}</span>
                    </div>
                </div>

                <div class="order-items-preview">
                    ${(order.items || []).map(item => `
                        <div class="order-item-thumb">
                            <img src="${API_BASE_URL}${item.product_image}" alt="${item.product_name}" onerror="this.src='./assets/default-avatar.png'">
                            <span>${item.product_name} x${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="order-card-footer">
                    <span class="order-total">$${Number(order.final_amount).toFixed(2)}</span>
                    <div class="order-actions">
                        <a href="./track-order.html?id=${order.id}" class="btn-sm btn-track">Track Order</a>
                        <a href="${API_BASE_URL}/api/orders/${order.id}/invoice"
                           class="btn-sm btn-invoice"
                           download="invoice-${order.id}.pdf"
                           onclick="attachInvoiceAuth(event, ${order.id})">Download Invoice</a>
                        ${['shipped', 'delivered'].includes(order.order_status) && order.payment_status !== 'refunded' ?
                            `<a href="./refund.html" class="btn-sm btn-refund">Request Refund</a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

function attachInvoiceAuth(e, orderId) {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/orders/${orderId}/invoice`, {
        headers: authHeaders
    })
    .then(res => res.blob())
    .then(blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `invoice-${orderId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

loadOrders();
