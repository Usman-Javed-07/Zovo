// navbar.js — user menu, cart count, dropdown toggle

// Inject Material Icons font once
(function () {
    if (!document.querySelector('link[href*="Material+Icons"]')) {
        const link = document.createElement("link");
        link.rel  = "stylesheet";
        link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
        document.head.appendChild(link);
    }
}());

// Cart count (API_BASE_URL comes from config.js loaded before this script)
async function loadCartCount() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/cart/count`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const badge = document.getElementById("cartCount");
        if (badge) badge.textContent = data.count || 0;
    } catch (error) {
        console.error("Cart count error:", error);
    }
}

// ── User menu ──────────────────────────────────────────────────────────────
function loadUser() {
    const token = localStorage.getItem("token");
    const user  = token ? JSON.parse(localStorage.getItem("user")) : null;

    const nameEl     = document.getElementById("userName");
    const imgEl      = document.getElementById("userImage");
    const dropdownEl = document.getElementById("dropdownMenu");

    if (!nameEl || !imgEl || !dropdownEl) return; // navbar elements not in this page

    if (!user) {
        nameEl.textContent = "Guest";
        imgEl.src = "./assets/default-avatar.png";
        imgEl.onerror = () => { imgEl.src = ""; imgEl.style.display = "none"; };
        dropdownEl.innerHTML = `
            <a href="./login.html">Login</a>
            <a href="./register.html">Sign Up</a>
        `;
    } else {
        nameEl.textContent = user.name || "User";
        if (user.image) {
            imgEl.src = API_BASE_URL + user.image;
            imgEl.onerror = () => { imgEl.src = ""; imgEl.style.display = "none"; };
        } else {
            imgEl.src = "./assets/default-avatar.png";
            imgEl.onerror = () => { imgEl.src = ""; imgEl.style.display = "none"; };
        }

        dropdownEl.innerHTML = `
            ${user.role === "admin" ? `
                <a href="./admin-orders.html">Admin Panel</a>
                <a href="./admin-users.html">Manage Users</a>
                <a href="./add-product.html">Add Product</a>
            ` : `
                <a href="./order-history.html">My Orders</a>
                <a href="./wallet.html">My Wallet</a>
                <a href="./wishlist.html">My Wishlist</a>
            `}
            <a href="./profile.html">Profile</a>
            <button onclick="logout()">Logout</button>
        `;

        // Auto-logout after 7 days (in case page stays open)
        const loginTime = parseInt(localStorage.getItem("loginTime") || "0");
        const elapsed   = Date.now() - loginTime;
        const remaining = 7 * 24 * 60 * 60 * 1000 - elapsed;
        if (remaining <= 0) {
            logout();
            return;
        }
        setTimeout(() => {
            logout();
            alert("Session expired. Please login again.");
        }, remaining);
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");
    window.location.href = "./login.html";
}

// ── Dropdown toggle (click-based) ──────────────────────────────────────────
function initDropdown() {
    const userInfo   = document.getElementById("userInfo");
    const dropdown   = document.getElementById("dropdownMenu");
    if (!userInfo || !dropdown) return;

    // Replace plain text arrow with Material Icon
    const iconEl = userInfo.querySelector(".dropdown-icon");
    if (iconEl) {
        iconEl.classList.add("material-icons");
        iconEl.textContent = "arrow_drop_down";
    }

    const userMenu = userInfo.closest(".user-menu");

    userInfo.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("open");
        if (userMenu) userMenu.classList.toggle("open");
    });

    // Close when clicking anywhere else on the page
    document.addEventListener("click", function () {
        dropdown.classList.remove("open");
        if (userMenu) userMenu.classList.remove("open");
    });

    // Prevent clicks inside dropdown from closing it
    dropdown.addEventListener("click", function (e) {
        e.stopPropagation();
    });
}

// ── Hide cart icon for admin ─────────────────────────────────────────────────
function hideCartForAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.role === 'admin') {
        const cartEl = document.querySelector('.cart-icon-wrapper');
        if (cartEl) cartEl.style.display = 'none';
    }
}

// ── Notification Bell ────────────────────────────────────────────────────────
function timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

async function loadNotifCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res  = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        if (data.count > 0) {
            badge.textContent = data.count > 99 ? '99+' : data.count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (_) {}
}

async function loadNotifList() {
    const list = document.getElementById('notifList');
    if (!list) return;
    try {
        const token = localStorage.getItem('token');
        const res   = await fetch(`${API_BASE_URL}/api/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data  = await res.json();

        if (!data.data || !data.data.length) {
            list.innerHTML = '<p class="notif-empty">No notifications</p>';
            return;
        }

        list.innerHTML = data.data.map(n => `
            <div class="notif-item${n.is_read ? '' : ' unread'}">
                <div class="notif-title">${n.title}</div>
                <div class="notif-msg">${n.message}</div>
                <div class="notif-time">${timeAgo(n.created_at)}</div>
            </div>
        `).join('');

        // Mark all as read after opening
        fetch(`${API_BASE_URL}/api/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => loadNotifCount()).catch(() => {});
    } catch (_) {
        list.innerHTML = '<p class="notif-empty">Failed to load</p>';
    }
}

function initNotificationBell() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;

    const bell = document.createElement('div');
    bell.className = 'notif-bell';
    bell.innerHTML = `
        <button class="notif-bell-btn" id="notifBellBtn" aria-label="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#e3e3e3">
                <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z"/>
            </svg>
            <span class="notif-badge" id="notifBadge" style="display:none">0</span>
        </button>
        <div class="notif-dropdown" id="notifDropdown">
            <div class="notif-header">
                <span>Notifications</span>
                <button class="notif-mark-all" id="notifMarkAll">Mark all read</button>
            </div>
            <div class="notif-list" id="notifList">
                <p class="notif-empty">Loading...</p>
            </div>
        </div>
    `;
    userMenu.parentNode.insertBefore(bell, userMenu);

    loadNotifCount();
    // Refresh count every 30 seconds
    setInterval(loadNotifCount, 30000);

    const bellBtn    = document.getElementById('notifBellBtn');
    const dropdown   = document.getElementById('notifDropdown');
    const markAllBtn = document.getElementById('notifMarkAll');

    bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        if (isOpen) loadNotifList();
    });

    markAllBtn.addEventListener('click', async function (e) {
        e.stopPropagation();
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadNotifCount();
        loadNotifList();
    });

    document.addEventListener('click', function () {
        if (dropdown) dropdown.classList.remove('open');
    });

    dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
}

// ── Init ────────────────────────────────────────────────────────────────────
loadCartCount();
loadUser();
initDropdown();
hideCartForAdmin();
initNotificationBell();
