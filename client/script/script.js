// Active nav link highlight
const links = document.querySelectorAll(".navbar a");
links.forEach((link) => {
    if (link.href === window.location.href) link.classList.add("active");
});

// Navbar search — suggestions + redirect
(function () {
    const searchBar   = document.querySelector('.search-bar');
    const searchInput = searchBar ? searchBar.querySelector('input') : null;
    const searchBtn   = searchBar ? searchBar.querySelector('.search-btn') : null;
    if (!searchInput || !searchBtn) return;

    // Create suggestions dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'search-suggestions';
    searchBar.appendChild(dropdown);

    let allProducts    = [];
    let productsLoaded = false;

    async function fetchProducts() {
        if (productsLoaded) return;
        try {
            const base = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '';
            const res  = await fetch(`${base}/api/products`);
            allProducts    = await res.json();
            productsLoaded = true;
        } catch (_) {}
    }

    function showSuggestions(q) {
        if (!q) { dropdown.classList.remove('open'); return; }
        const query   = q.toLowerCase();
        const matches = allProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        ).slice(0, 6);

        if (!matches.length) { dropdown.classList.remove('open'); return; }

        const base = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '';
        dropdown.innerHTML = matches.map(p => `
            <div class="search-suggestion-item" data-name="${p.name}">
                ${p.image
                    ? `<img src="${base}${p.image}" class="suggestion-img" alt="">`
                    : `<div class="suggestion-img-placeholder"></div>`
                }
                <span>${p.name}</span>
            </div>
        `).join('');
        dropdown.classList.add('open');

        dropdown.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const name = item.dataset.name;
                searchInput.value = name;
                dropdown.classList.remove('open');
                window.location.href = `./products.html?q=${encodeURIComponent(name)}`;
            });
        });
    }

    searchInput.addEventListener('input', async function () {
        await fetchProducts();
        showSuggestions(this.value.trim());
    });

    searchInput.addEventListener('focus', async function () {
        if (this.value.trim()) {
            await fetchProducts();
            showSuggestions(this.value.trim());
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => dropdown.classList.remove('open'), 150);
    });

    function doSearch() {
        const q = searchInput.value.trim();
        dropdown.classList.remove('open');
        if (!q) return;
        window.location.href = `./products.html?q=${encodeURIComponent(q)}`;
    }

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  doSearch();
        if (e.key === 'Escape') dropdown.classList.remove('open');
    });
}());

// Hero swiper (only on pages that have it)
if (typeof Swiper !== "undefined" && document.querySelector(".heroSwiper")) {
    new Swiper(".heroSwiper", {
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        speed: 800,
        direction: "horizontal",
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }
    });
}
