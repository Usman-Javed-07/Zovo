const form = document.getElementById('productForm');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    alert(data.message);
    form.reset();
});
