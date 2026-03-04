// ── Auth guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user) {
    window.location.href = './login.html';
}

const authHeaders = { 'Authorization': `Bearer ${_token}` };

const params  = new URLSearchParams(window.location.search);
const orderId = params.get('id');
if (!orderId) {
    window.location.href = './order-history.html';
}

const STEPS = [
    { key: 'processing', label: 'Order Placed',  desc: 'Your order has been received' },
    { key: 'confirmed',  label: 'Confirmed',      desc: 'Order confirmed by seller' },
    { key: 'shipped',    label: 'Shipped',         desc: 'Package dispatched to courier' },
    { key: 'delivered',  label: 'Delivered',       desc: 'Package delivered to you' }
];

const ORDER_INDEX = {
    processing: 0,
    confirmed:  1,
    shipped:    2,
    delivered:  3,
    cancelled:  -1
};

function renderTrackPage(order, shipment) {
    const container   = document.getElementById('trackContent');
    const currentIdx  = ORDER_INDEX[order.order_status] ?? 0;

    const timelineHtml = STEPS.map((step, idx) => {
        let cls = '';
        if (idx < currentIdx)  cls = 'done';
        if (idx === currentIdx) cls = 'active';
        return `
            <div class="timeline-step ${cls}">
                <div class="timeline-dot"></div>
                <div class="timeline-label">${step.label}</div>
                <div class="timeline-desc">${step.desc}</div>
            </div>
        `;
    }).join('');

    const trackingHtml = shipment && shipment.tracking_number ? `
        <div class="tracking-info">
            <div>
                <div class="tracking-label">Tracking Number</div>
                <div class="tracking-number">${shipment.tracking_number}</div>
            </div>
            <div class="tracking-courier">${shipment.courier_name || 'Courier'}</div>
        </div>
    ` : '';

    container.innerHTML = `
        <div class="live-badge">
            <div class="live-dot"></div>
            Live Tracking
        </div>

        <div class="track-card">
            <div class="track-header">
                <div>
                    <div class="track-order-id">Order #${order.id}</div>
                </div>
                <div class="track-meta">
                    <p>Placed: <span>${new Date(order.created_at).toLocaleDateString()}</span></p>
                    <p>Payment: <span>${order.payment_method.toUpperCase()} — ${order.payment_status.toUpperCase()}</span></p>
                    <p>Amount: <span>$${Number(order.final_amount).toFixed(2)}</span></p>
                </div>
            </div>

            ${trackingHtml}

            <div class="timeline">
                ${order.order_status === 'cancelled'
                    ? '<p style="color:#f54242;font-weight:600;">This order was cancelled.</p>'
                    : timelineHtml
                }
            </div>
        </div>
    `;
}

async function loadTracking() {
    const container = document.getElementById('trackContent');
    try {
        const [orderRes, shipRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/orders/${orderId}`,              { headers: authHeaders }),
            fetch(`${API_BASE_URL}/api/shipments/order/${orderId}`,     { headers: authHeaders })
        ]);

        const order    = await orderRes.json();
        const shipment = await shipRes.json();

        if (!order.id) throw new Error('Order not found');

        renderTrackPage(order, shipment);

        // ── Real-time via Socket.io ──
        if (typeof io !== 'undefined') {
            const socket = io(API_BASE_URL);
            socket.emit('join', _user.id);

            socket.on('order_update', (data) => {
                if (String(data.orderId) === String(orderId)) {
                    order.order_status = data.order_status;
                    renderTrackPage(order, shipment);
                }
            });
        }

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

loadTracking();
