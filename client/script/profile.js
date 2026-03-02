// Auth guard
const token = localStorage.getItem("token");
if (!token) window.location.href = "./login.html";

async function loadProfile() {
    try {
        const res  = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        const u = data.user;

        document.getElementById("displayName").textContent     = u.name  || "—";
        document.getElementById("displayEmail").textContent    = u.email || "—";
        document.getElementById("displayRole").textContent     = u.role  || "user";
        document.getElementById("displayVerified").textContent = u.is_verified ? "✓ Verified" : "Not verified";

        const avatarSrc = u.image ? `${API_BASE_URL}${u.image}` : "./assets/default-avatar.png";
        document.getElementById("profileAvatar").src = avatarSrc;
        document.getElementById("previewImg").src    = avatarSrc;

        document.getElementById("editName").value = u.name || "";

        localStorage.setItem("user", JSON.stringify(u));
        if (typeof loadUser === "function") loadUser();

    } catch (err) {
        console.error("Profile load error:", err);
    }
}

loadProfile();

// Avatar preview when file selected
document.getElementById("avatarInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("profileAvatar").src = e.target.result;
        document.getElementById("previewImg").src    = e.target.result;
    };
    reader.readAsDataURL(file);
});

function showMsg(text, isError) {
    const el       = document.getElementById("profileMsg");
    el.textContent = text;
    el.className   = "auth-msg " + (isError ? "auth-msg--error" : "auth-msg--success");
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 4000);
}

document.getElementById("profileForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled    = true;
    saveBtn.textContent = "Saving…";

    const formData = new FormData();
    const name = document.getElementById("editName").value.trim();
    const file = document.getElementById("avatarInput").files[0];

    if (name) formData.append("name",  name);
    if (file) formData.append("image", file);

    if (!name && !file) {
        showMsg("Nothing to update.", false);
        saveBtn.disabled    = false;
        saveBtn.textContent = "Save Changes";
        return;
    }

    try {
        const res  = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method:  "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body:    formData
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            showMsg("Profile updated successfully!", false);
            await loadProfile();
            if (typeof loadUser === "function") loadUser();
        } else {
            showMsg(data.message || "Update failed.", true);
        }
    } catch (err) {
        showMsg("Network error. Please try again.", true);
        console.error(err);
    } finally {
        saveBtn.disabled    = false;
        saveBtn.textContent = "Save Changes";
    }
});
