const loginForm = document.getElementById("loginForm");
const authMsg   = document.getElementById("authMsg");

function showMsg(text, isError) {
    authMsg.textContent   = text;
    authMsg.className     = "auth-msg " + (isError ? "auth-msg--error" : "auth-msg--success");
    authMsg.style.display = "block";
}

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const data = {
        email:    loginForm.email.value,
        password: loginForm.password.value
    };

    try {
        const res    = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            localStorage.setItem("token",     result.token);
            localStorage.setItem("user",      JSON.stringify(result.user));
            localStorage.setItem("loginTime", Date.now().toString());
            window.location.href = "./index.html";
        } else {
            showMsg(result.message || "Login failed.", true);
        }
    } catch (err) {
        showMsg("Network error. Please try again.", true);
        console.error(err);
    }
});
