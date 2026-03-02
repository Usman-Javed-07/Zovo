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
        const res = await fetch(`${API_BASE_URL}/api/cart/count`);
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
            ${user.role === "admin" ? '<a href="./add-product.html">Add Product</a>' : ""}
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

// ── Init ────────────────────────────────────────────────────────────────────
loadCartCount();
loadUser();
initDropdown();
