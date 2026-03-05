/* ──────────────────────────────────────────────────────────────
   wishlist.js — My Wishlist page (protected, JWT required)
   ────────────────────────────────────────────────────────────── */

const HEART_FILLED = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8445a"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>`;

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = './login.html';
}

// ── State ─────────────────────────────────────────────────────
let currentPage = 1;
const PAGE_SIZE = 12;
const cartProductIds = new Set();

// ── Fetch cart IDs ────────────────────────────────────────────
async function loadCartIds() {
    try {
        const res  = await fetch(`${API_BASE_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } });
        const cart = await res.json();
        if (Array.isArray(cart)) cart.forEach((item) => cartProductIds.add(String(item.id)));
    } catch (_) {}
}

// ── Build 5-star HTML (interactive, same as products page) ───
function buildStars(avgRating, ratingCount, userRating, productId) {
    const avg     = parseFloat(avgRating) || 0;
    const rounded = Math.round(avg);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        const filled   = i <= rounded ? ' filled' : '';
        const selected = userRating && i <= userRating ? ' selected' : '';
        stars += `<span class="star${filled}${selected}" data-product-id="${productId}" data-star="${i}">★</span>`;
    }
    const countLabel = ratingCount > 0 ? `(${ratingCount})` : '';
    return `<div class="star-row" data-product-id="${productId}">${stars}<span class="rating-count-lbl">${countLabel}</span></div>`;
}

// ── Render a single wishlist card ─────────────────────────────
function buildWishlistCard(p) {
    const inCart = cartProductIds.has(String(p.id));
    return `
        <div class="card-item" data-product-id="${p.id}">
            <img class="card-image" src="${API_BASE_URL}${p.image}" alt="${p.name}">
            <button class="heart-btn liked" data-id="${p.id}" aria-label="Remove from wishlist">
                <span class="heart-icon">${HEART_FILLED}</span>
                <span class="like-count">${p.like_count || 0}</span>
            </button>
            <div class="card-details">
                <div class="star-and-reviews">
                    ${buildStars(p.avg_rating, p.rating_count, p.user_rating, p.id)}
                    <a class="review-link" href="./reviews.html?id=${p.id}" title="View reviews">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-832v752Z"/></svg>
                    </a>
                </div>
                <div class="feedback-panel" data-product-id="${p.id}">
                    <textarea class="feedback-input" placeholder="Share your experience..." rows="2"></textarea>
                    <div class="feedback-actions">
                        <button class="feedback-skip-btn" data-id="${p.id}">Skip</button>
                        <button class="feedback-submit-btn" data-id="${p.id}">Post Review</button>
                    </div>
                </div>
                <h3 class="card-heading">${p.name}</h3>
                <p class="card-para">${p.description} <svg xmlns="http://www.w3.org/2000/svg" height="7px" viewBox="0 -960 960 960" width="7px" fill="#e3e3e3"><path d="M281.5-281.5Q200-363 200-480t81.5-198.5Q363-760 480-760t198.5 81.5Q760-597 760-480t-81.5 198.5Q597-200 480-200t-198.5-81.5Z"/></svg> ${p.material}</p>
                <div class="card-price">
                    <p>$${p.price}</p>
                    <button class="add-to-cart-btn${inCart ? ' in-cart' : ''}" data-id="${p.id}"${inCart ? ' disabled' : ''}>${inCart ? TICK_ICON_SVG : CART_ICON_SVG}</button>
                </div>
                <button class="wishlist-remove-btn" data-id="${p.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                    Remove
                </button>
            </div>
        </div>`;
}

// ── Empty state ───────────────────────────────────────────────
function renderEmpty() {
    document.getElementById('wishlistGrid').innerHTML = `
        <div class="wishlist-empty">
            <svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="#444">
                <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/>
            </svg>
            <h3>Your wishlist is empty</h3>
            <p>Browse products and click the heart icon to save items here.</p>
            <a href="./products.html" class="wishlist-browse-btn">Browse Products</a>
        </div>`;
    document.getElementById('paginationBar').innerHTML = '';
    document.getElementById('wishlistCount').textContent = '';
}

// ── Pagination bar ────────────────────────────────────────────
function renderPagination(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const bar = document.getElementById('paginationBar');
    if (totalPages <= 1) { bar.innerHTML = ''; return; }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    bar.innerHTML = html;
}

// ── Fetch & render wishlist ───────────────────────────────────
async function loadWishlist(page = 1) {
    try {
        await loadCartIds();
        const res  = await fetch(`${API_BASE_URL}/api/favorites/my?page=${page}&limit=${PAGE_SIZE}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();

        if (!json.success) {
            renderEmpty();
            return;
        }

        const { products, total } = json.data;

        if (!products.length) {
            renderEmpty();
            return;
        }

        document.getElementById('wishlistGrid').innerHTML = products.map(buildWishlistCard).join('');
        document.getElementById('wishlistCount').textContent = `${total} item${total !== 1 ? 's' : ''}`;
        renderPagination(total, page, PAGE_SIZE);
        currentPage = page;

    } catch (err) {
        console.error('[wishlist load]', err);
    }
}

loadWishlist();

// ── Pagination click ──────────────────────────────────────────
document.getElementById('paginationBar').addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (!btn) return;
    loadWishlist(parseInt(btn.dataset.page, 10));
});

// ── Heart (unlike) on wishlist page ──────────────────────────
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.heart-btn');
    if (!btn) return;

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

        // Item was unliked — remove card from grid
        if (data.data.action === 'unliked') {
            const card = document.querySelector(`.card-item[data-product-id="${productId}"]`);
            if (card) {
                card.classList.add('card-remove');
                card.addEventListener('animationend', () => {
                    card.remove();
                    // Reload if grid is now empty or recount
                    const remaining = document.querySelectorAll('.card-item').length;
                    if (remaining === 0) loadWishlist(currentPage > 1 ? currentPage - 1 : 1);
                }, { once: true });
            }
        }
    } catch (err) {
        console.error('[wishlist unlike]', err);
    }
});

// ── Star click — rate product ─────────────────────────────────
document.addEventListener('click', async (e) => {
    const star = e.target.closest('.star');
    if (!star) return;

    if (!token) { window.location.href = './login.html'; return; }

    const productId = star.dataset.productId;
    const rating    = parseInt(star.dataset.star, 10);
    const row       = document.querySelector(`.star-row[data-product-id="${productId}"]`);

    if (row) {
        row.querySelectorAll('.star').forEach((s, i) => {
            s.classList.toggle('selected', i < rating);
            s.classList.toggle('filled',   i < rating);
        });
    }

    try {
        const res  = await fetch(`${API_BASE_URL}/api/ratings/${productId}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ rating })
        });
        const data = await res.json();
        if (!data.success) {
            if (row) row.querySelectorAll('.star').forEach((s) => s.classList.remove('selected', 'filled', 'hovered'));
            if (data.message) alert(data.message);
            return;
        }
        if (!row) return;

        const rounded = Math.round(parseFloat(data.data.avg_rating));
        row.querySelectorAll('.star').forEach((s, i) => {
            s.classList.toggle('filled',   i < rounded);
            s.classList.toggle('selected', i < rating);
        });
        const lbl = row.querySelector('.rating-count-lbl');
        if (lbl) lbl.textContent = `(${data.data.rating_count})`;

        const panel = document.querySelector(`.feedback-panel[data-product-id="${productId}"]`);
        if (panel) panel.classList.add('active');

    } catch (err) {
        console.error('[wishlist rate]', err);
    }
});

// ── Star hover preview ────────────────────────────────────────
document.addEventListener('mouseover', (e) => {
    const star = e.target.closest('.star');
    if (!star) return;
    const row     = star.closest('.star-row');
    const hovered = parseInt(star.dataset.star, 10);
    row.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('hovered', i < hovered);
    });
});

document.addEventListener('mouseout', (e) => {
    const star = e.target.closest('.star');
    if (!star) return;
    star.closest('.star-row').querySelectorAll('.star').forEach((s) => s.classList.remove('hovered'));
});

// ── Feedback submit ───────────────────────────────────────────
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.feedback-submit-btn');
    if (!btn) return;

    const productId = btn.dataset.id;
    const panel     = document.querySelector(`.feedback-panel[data-product-id="${productId}"]`);
    const textarea  = panel ? panel.querySelector('.feedback-input') : null;
    const feedback  = textarea ? textarea.value.trim() : '';
    if (!feedback) { if (textarea) textarea.focus(); return; }

    btn.disabled = true;
    try {
        const res  = await fetch(`${API_BASE_URL}/api/ratings/${productId}/feedback`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({ feedback })
        });
        const data = await res.json();
        if (data.success && panel) {
            panel.innerHTML = `<p class="feedback-thanks">Thanks for your review! <a href="./reviews.html?id=${productId}">View all reviews →</a></p>`;
        } else {
            btn.disabled = false;
        }
    } catch (err) {
        console.error('[wishlist feedback]', err);
        btn.disabled = false;
    }
});

// ── Feedback skip ─────────────────────────────────────────────
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.feedback-skip-btn');
    if (!btn) return;
    const panel = document.querySelector(`.feedback-panel[data-product-id="${btn.dataset.id}"]`);
    if (panel) panel.classList.remove('active');
});

// ── Explicit remove button ────────────────────────────────────
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.wishlist-remove-btn');
    if (!btn) return;

    const productId = btn.dataset.id;
    btn.disabled = true;

    try {
        const res  = await fetch(`${API_BASE_URL}/api/favorites/${productId}/toggle`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) { btn.disabled = false; return; }

        const card = document.querySelector(`.card-item[data-product-id="${productId}"]`);
        if (card) {
            card.classList.add('card-remove');
            card.addEventListener('animationend', () => {
                card.remove();
                const remaining = document.querySelectorAll('.card-item').length;
                if (remaining === 0) loadWishlist(currentPage > 1 ? currentPage - 1 : 1);
            }, { once: true });
        }
    } catch (err) {
        console.error('[wishlist remove]', err);
        btn.disabled = false;
    }
});

const CART_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-600v-120H320v-80h120v-120h80v120h120v80H520v120h-80ZM223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z"/></svg>`;
const TICK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#4caf50"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>`;

// ── Add to cart — only fires on <button>, never on navbar <a> ─
document.addEventListener('click', async (e) => {
    const button = e.target.closest('button.add-to-cart-btn');
    if (!button || button.disabled) return;

    const productId  = button.dataset.id;
    button.disabled  = true;
    button.innerHTML = TICK_ICON_SVG;

    try {
        const res  = await fetch(`${API_BASE_URL}/api/cart`, {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization:  `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });
        const data = await res.json();
        if (data.success) {
            button.classList.add('in-cart');
            cartProductIds.add(String(productId));
            loadCartCount();
        } else {
            button.innerHTML = CART_ICON_SVG;
            button.disabled  = false;
        }
    } catch (err) {
        console.error(err);
        button.innerHTML = CART_ICON_SVG;
        button.disabled  = false;
    }
});
