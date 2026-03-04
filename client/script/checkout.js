// ── Auth guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user) {
    window.location.href = './login.html';
}

const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${_token}`
});

let cartItems       = [];
let subtotal        = 0;
let discountAmount  = 0;
let walletUsed      = 0;
let walletBalance   = 0;
let appliedCoupon   = null;

// ── Load cart ──
async function loadCart() {
    const res  = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${_token}` }
    });
    cartItems = await res.json();

    if (!cartItems.length) {
        document.getElementById('summaryItems').innerHTML =
            '<p style="color:#888;text-align:center">Your cart is empty.</p>';
        return;
    }

    subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    renderSummary();
}

function renderSummary() {
    const container = document.getElementById('summaryItems');
    container.innerHTML = cartItems.map(item => `
        <div class="summary-item">
            <img src="${API_BASE_URL}${item.image}" alt="${item.name}" onerror="this.src='./assets/default-avatar.png'">
            <div class="summary-item-info">
                <div class="s-name">${item.name}</div>
                <div class="s-meta">x${item.quantity}</div>
            </div>
            <div class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    updateTotals();
}

function updateTotals() {
    const useWallet = document.getElementById('useWallet').checked;
    const afterDiscount = subtotal - discountAmount;
    walletUsed = useWallet ? Math.min(walletBalance, afterDiscount) : 0;
    const final = Math.max(0, afterDiscount - walletUsed);

    document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent    = `$${final.toFixed(2)}`;

    const discRow = document.getElementById('discountRow');
    if (discountAmount > 0) {
        discRow.style.display = 'flex';
        document.getElementById('summaryDiscount').textContent = `-$${discountAmount.toFixed(2)}`;
    } else {
        discRow.style.display = 'none';
    }

    const walRow = document.getElementById('walletRow');
    if (walletUsed > 0) {
        walRow.style.display = 'flex';
        document.getElementById('summaryWallet').textContent = `-$${walletUsed.toFixed(2)}`;
    } else {
        walRow.style.display = 'none';
    }
}

// ── Load wallet ──
async function loadWallet() {
    try {
        const res  = await fetch(`${API_BASE_URL}/api/wallet/balance`, { headers: headers() });
        const data = await res.json();
        walletBalance = Number(data.balance) || 0;
        document.getElementById('walletBalanceDisplay').textContent =
            `Balance: $${walletBalance.toFixed(2)}`;
    } catch (_) {}
}

// ── Wallet toggle ──
document.getElementById('useWallet').addEventListener('change', updateTotals);

// ── Apply coupon ──
document.getElementById('applyCouponBtn').addEventListener('click', async () => {
    const code = document.getElementById('couponCode').value.trim();
    const msg  = document.getElementById('couponMsg');

    if (!code) { msg.textContent = 'Enter a coupon code.'; msg.className = 'coupon-msg error'; return; }

    try {
        const res  = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ code, order_amount: subtotal })
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        appliedCoupon   = code;
        discountAmount  = Number(data.discount);
        msg.textContent = `✓ Coupon applied! -$${discountAmount.toFixed(2)}`;
        msg.className   = 'coupon-msg success';
        updateTotals();
    } catch (err) {
        appliedCoupon  = null;
        discountAmount = 0;
        msg.textContent = err.message;
        msg.className   = 'coupon-msg error';
        updateTotals();
    }
});

// ── Place order ──
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('placeOrderBtn');
    const msg = document.getElementById('orderMsg');
    btn.disabled   = true;
    btn.textContent = 'Placing order...';
    msg.textContent = '';

    const payment_method = document.querySelector('input[name="payment_method"]:checked').value;

    const body = {
        shipping_name:    document.getElementById('shipping_name').value.trim(),
        shipping_phone:   document.getElementById('shipping_phone').value.trim(),
        shipping_address: document.getElementById('shipping_address').value.trim(),
        shipping_city:    document.getElementById('shipping_city').value.trim(),
        notes:            document.getElementById('order_notes').value.trim(),
        payment_method,
        coupon_code: appliedCoupon || undefined,
        use_wallet:  document.getElementById('useWallet').checked
    };

    try {
        const res  = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        if (data.stripeUrl) {
            // Stripe redirect
            window.location.href = data.stripeUrl;
        } else {
            msg.textContent = `Order #${data.orderId} placed successfully!`;
            msg.className   = 'order-msg success';
            setTimeout(() => { window.location.href = './order-history.html'; }, 1500);
        }
    } catch (err) {
        msg.textContent = err.message;
        msg.className   = 'order-msg error';
        btn.disabled    = false;
        btn.textContent = 'Place Order';
    }
});

// ── Stripe info message on radio change ──
document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const msg = document.getElementById('orderMsg');
        // Update active styling via JS (fallback for browsers without :has() support)
        document.querySelectorAll('.pay-option').forEach(opt => opt.classList.remove('selected'));
        radio.closest('.pay-option').classList.add('selected');

        if (radio.value === 'stripe') {
            msg.textContent = 'You will be redirected to Stripe to complete payment securely.';
            msg.className   = 'order-msg info';
        } else {
            msg.textContent = '';
            msg.className   = 'order-msg';
        }
    });
});

// ── Pre-fill shipping from profile ──
if (_user && _user.name) {
    document.getElementById('shipping_name').value = _user.name;
}

// ── Init ──
loadCart();
loadWallet();
