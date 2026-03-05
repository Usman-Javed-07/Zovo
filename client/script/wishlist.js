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

// ── Render a single wishlist card ─────────────────────────────
function buildWishlistCard(p) {
    return `
        <div class="card-item" data-product-id="${p.id}">
            <img class="card-image" src="${API_BASE_URL}${p.image}" alt="${p.name}">
            <button class="heart-btn liked" data-id="${p.id}" aria-label="Remove from wishlist">
                <span class="heart-icon">${HEART_FILLED}</span>
                <span class="like-count">${p.like_count || 0}</span>
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
                    <button class="add-to-cart-btn" data-id="${p.id}"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-600v-120H320v-80h120v-120h80v120h120v80H520v120h-80ZM223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z"/></svg></button>
                </div>
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
