

async function loadProducts() {
    const res = await fetch(`${API_BASE_URL}/api/products`);
    const products = await res.json();
    const container = document.getElementById('productList');
    container.innerHTML = products.map(p => `
        
        <div class="card-item">
            <img class="card-image" src="${API_BASE_URL}${p.image}" alt="${p.name}">
            <span class="heart-icon">${p.is_favorite ? '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FF0000"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px"><path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/></svg>'}</span>
            <div class="card-details">
                <div class="cart-item--rating">
                    <span class="rating-star"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px"><path d="m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z"/></svg></span>
                    <p>${p.rating} (${p.rating_count})</p>
                </div>
                <h3 class="card-heading">${p.name}</h3>
                <p class="card-para">${p.description} <svg xmlns="http://www.w3.org/2000/svg" height="7px" viewBox="0 -960 960 960" width="7px" fill="#e3e3e3"><path d="M281.5-281.5Q200-363 200-480t81.5-198.5Q363-760 480-760t198.5 81.5Q760-597 760-480t-81.5 198.5Q597-200 480-200t-198.5-81.5Z"/></svg> ${p.material}</p>
                <div class="card-price">
                    <p>$${p.price}</p>
                     <button class="add-to-cart-btn"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-600v-120H320v-80h120v-120h80v120h120v80H520v120h-80ZM223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM40-800v-80h131l170 360h280l156-280h91L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68.5-39t-1.5-79l54-98-144-304H40Z"/></svg></button>
                </div>
            </div>
        </div>
       
    `).join('');
}
loadProducts();