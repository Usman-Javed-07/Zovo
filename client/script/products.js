/* ──────────────────────────────────────────────────────────────
   products.js — product listing with favorites & real-time likes
   ────────────────────────────────────────────────────────────── */

const HEART_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8445a"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>`;
const HEART_EMPTY  = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>`;
const CART_ICON    = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-600v-120H320v-80h120v-120h80v120h120v80H520v120h-80ZM223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z"/></svg>`;
const TICK_ICON    = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#4caf50"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

// ── Socket.io ─────────────────────────────────────────────────
let socket = null;
if (typeof io !== 'undefined') {
    socket = io(API_BASE_URL);
}

// ── In-cart product IDs (loaded once on init) ─────────────────
const cartProductIds = new Set();

// ── Card builder ──────────────────────────────────────────────
function buildProductCard(p, inCart = false) {
    const liked     = !!p.is_liked_by_user;
    const likeCount = p.like_count || 0;

    return `
        <div class="card-item" data-product-id="${p.id}">
            <img class="card-image" src="${API_BASE_URL}${p.image}" alt="${p.name}">
            <button class="heart-btn${liked ? ' liked' : ''}" data-id="${p.id}" aria-label="Toggle favorite">
                <span class="heart-icon">${liked ? HEART_FILLED : HEART_EMPTY}</span>
                <span class="like-count">${likeCount}</span>
            </button>
            <div class="card-details">
                <div class="cart-item--rating">
                    <span class="rating-star"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px"><path d="m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z"/></svg></span>
                    <p>${p.rating} (${p.rating_count})</p>
                </div>
                <h3 class="card-heading">${p.name}</h3>
                <p class="card-para">${p.description} <svg xmlns="http://www.w3.org/2000/svg" height="7px" viewBox="0 -960 960 960" width="7px" fill="#e3e3e3"><path d="M281.5-281.5Q200-363 200-480t81.5-198.5Q363-760 480-760t198.5 81.5Q760-597 760-480t-81.5 198.5Q597-200 480-200t-198.5-81.5Z"/></svg> ${p.material}</p>
                <div class="card-price">
                    <p>$${p.price}</p>
                    <button class="add-to-cart-btn${inCart ? ' in-cart' : ''}" data-id="${p.id}"${inCart ? ' disabled' : ''}>
                        ${inCart ? TICK_ICON : CART_ICON}
                    </button>
                </div>
            </div>
        </div>`;
}

// ── Mark a single button as "in cart" ─────────────────────────
function markInCart(productId) {
    const btn = document.querySelector(`button.add-to-cart-btn[data-id="${productId}"]`);
    if (!btn) return;
    btn.innerHTML = TICK_ICON;
    btn.disabled  = true;
    btn.classList.add('in-cart');
}

// ── Fetch cart product IDs for logged-in user ─────────────────
async function loadCartIds() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res  = await fetch(`${API_BASE_URL}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const cart = await res.json();
        if (Array.isArray(cart)) {
            // cart rows return p.id (joined from products table)
            cart.forEach((item) => cartProductIds.add(String(item.id)));
        }
    } catch (_) {}
}

// ── Load products ─────────────────────────────────────────────
async function loadProducts() {
    const token   = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    await loadCartIds();

    const res      = await fetch(`${API_BASE_URL}/api/products`, { headers });
    const products = await res.json();

    document.getElementById('productList').innerHTML = products
        .map((p) => buildProductCard(p, cartProductIds.has(String(p.id))))
        .join('');

    // Join socket room per product for live like-count updates
    if (socket) {
        products.forEach((p) => socket.emit('join_product', p.id));
    }
}

loadProducts();

// ── Real-time like count from socket ─────────────────────────
if (socket) {
    socket.on('like_update', ({ productId, likeCount }) => {
        const card    = document.querySelector(`.card-item[data-product-id="${productId}"]`);
        if (!card) return;
        const countEl = card.querySelector('.like-count');
        if (countEl) countEl.textContent = likeCount;
    });
}

// ── Heart button — toggle favorite ───────────────────────────
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.heart-btn');
    if (!btn) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    const productId = btn.dataset.id;

    btn.classList.add('heart-pop');
    btn.addEventListener('animationend', () => btn.classList.remove('heart-pop'), { once: true });

    try {
        const res  = await fetch(`${API_BASE_URL}/api/favorites/${productId}/toggle`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;

        const { action, likeCount } = data.data;
        const liked = action === 'liked';

        btn.classList.toggle('liked', liked);
        btn.querySelector('.heart-icon').innerHTML = liked ? HEART_FILLED : HEART_EMPTY;
        btn.querySelector('.like-count').textContent = likeCount;

    } catch (err) {
        console.error('[heart toggle]', err);
    }
});

// ── Add to cart — only fires on <button>, never on navbar <a> ─
document.addEventListener('click', async (e) => {
    const button = e.target.closest('button.add-to-cart-btn');
    if (!button || button.disabled) return;

    const productId = button.dataset.id;

    // Show loading tick immediately
    button.disabled  = true;
    button.innerHTML = TICK_ICON;

    try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_BASE_URL}/api/cart`, {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ productId })
        });
        const data = await res.json();

        if (data.success) {
            // Mark permanently as in-cart
            button.classList.add('in-cart');
            cartProductIds.add(String(productId));
            loadCartCount();
        } else {
            // Revert on failure
            button.innerHTML = CART_ICON;
            button.disabled  = false;
        }

    } catch (err) {
        console.error(err);
        button.innerHTML = CART_ICON;
        button.disabled  = false;
    }
});
