async function loadCartCount() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/cart/count`);
        const data = await res.json();

        const badge = document.getElementById("cartCount");
        if (badge) {
            badge.textContent = data.count || 0;
        }

    } catch (error) {
        console.error(error);
    }
}

loadCartCount();