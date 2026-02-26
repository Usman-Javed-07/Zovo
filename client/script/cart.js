async function loadCart() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/cart`);
        const cart = await res.json();

        const container = document.getElementById("cartContainer");

        if (!cart.length) {
            container.innerHTML = "<h2 class='empty-cart'>Your cart is empty</h2>";
            return;
        }

        let total = 0;

        container.innerHTML = cart.map(item => {
            total += item.price * item.quantity;

            return `
                <div class="cart-card">
                    <div class="cart-image">
                        <img src="${API_BASE_URL}${item.image}" alt="${item.name}">
                    </div>

                    <div class="cart-details">
                        <h3 class="cart-title">${item.name}</h3>
                        <p class="cart-price">$${item.price}</p>

                        <div class="cart-quantity">
                            <button class="qty-btn decrease" data-id="${item.id}" data-qty="${item.quantity}">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn increase" data-id="${item.id}" data-qty="${item.quantity}">+</button>
                        </div>

                        <button class="remove-btn" data-id="${item.id}">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        container.innerHTML += `
            <div class="cart-total">
                Total: $${total.toFixed(2)}
            </div>
        `;

    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("increase")) {
        const id = e.target.dataset.id;
        const qty = parseInt(e.target.dataset.qty) + 1;
        await updateQuantity(id, qty);
    }

    if (e.target.classList.contains("decrease")) {
        const id = e.target.dataset.id;
        const qty = parseInt(e.target.dataset.qty) - 1;
        if (qty > 0) {
            await updateQuantity(id, qty);
        }
    }

    if (e.target.classList.contains("remove-btn")) {
        const id = e.target.dataset.id;
        await removeItem(id);
    }
});

async function updateQuantity(productId, quantity) {
    await fetch(`${API_BASE_URL}/api/cart`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            productId,
            quantity
        })
    });

    loadCart();
    loadCartCount();
}

async function removeItem(productId) {
    await fetch(`${API_BASE_URL}/api/cart/${productId}`, {
        method: "DELETE"
    });

    loadCart();
    loadCartCount();
}

loadCart();