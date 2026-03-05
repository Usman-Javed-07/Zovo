/* ──────────────────────────────────────────────────────────────
   reviews.js — Product reviews listing page
   ────────────────────────────────────────────────────────────── */

const params    = new URLSearchParams(window.location.search);
const productId = params.get('id');

if (!productId) {
    window.location.href = './products.html';
}

// ── Star display (read-only) ──────────────────────────────────
function buildStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star${i <= rating ? ' filled' : ''}">★</span>`;
    }
    return `<div class="star-row">${stars}</div>`;
}

// ── Single review card ────────────────────────────────────────
function buildReviewCard(r) {
    const initial = r.user_name ? r.user_name.charAt(0).toUpperCase() : '?';
    const dt      = new Date(r.updated_at);
    const date    = dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const time    = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const avatarHtml = r.user_image
        ? `<img class="reviewer-avatar-img" src="${API_BASE_URL}${r.user_image}" alt="${r.user_name}">`
        : `<div class="reviewer-avatar">${initial}</div>`;

    return `
        <div class="review-card">
            <div class="review-header">
                ${avatarHtml}
                <div class="reviewer-info">
                    <span class="reviewer-name">${r.user_name}</span>
                    ${buildStars(r.rating)}
                </div>
                <span class="review-date">${date} · ${time}</span>
            </div>
            <p class="review-text">${r.feedback}</p>
        </div>`;
}

// ── Empty state ───────────────────────────────────────────────
function renderEmpty() {
    document.getElementById('reviewsGrid').innerHTML = `
        <div class="reviews-empty">
            <svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="#444">
                <path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-832v752Z"/>
            </svg>
            <h3>No reviews yet</h3>
            <p>Be the first to share your experience with this product.</p>
            <a href="./products.html" class="reviews-back-btn">Browse Products</a>
        </div>`;
    document.getElementById('reviewsCount').textContent = '0 reviews';
}

// ── Fetch & render ────────────────────────────────────────────
async function loadReviews() {
    try {
        const res  = await fetch(`${API_BASE_URL}/api/ratings/${productId}/reviews`);
        const json = await res.json();

        if (!json.success) { renderEmpty(); return; }

        const { product, reviews } = json.data;

        document.getElementById('reviewProductName').textContent  = product.name + ' — Reviews';
        document.getElementById('reviewsProductTitle').textContent = product.name;
        document.title = `Zovo — ${product.name} Reviews`;

        if (!reviews.length) { renderEmpty(); return; }

        document.getElementById('reviewsCount').textContent =
            `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
        document.getElementById('reviewsGrid').innerHTML = reviews.map(buildReviewCard).join('');

    } catch (err) {
        console.error('[reviews load]', err);
    }
}

loadReviews();
