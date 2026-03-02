// Admin guard
const token = localStorage.getItem("token");
const user  = JSON.parse(localStorage.getItem("user"));

if (!token || !user || user.role !== "admin") window.location.href = "./login.html";

document.getElementById("productForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const res    = await fetch(`${API_BASE_URL}/api/products`, {
            method:  "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body:    formData
        });
        const result = await res.json();
        if (result.success) {
            alert("Product added successfully");
            e.target.reset();
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error(err);
    }
});
