let currentUserId  = null;
let otpCountdown   = 0;
let countdownTimer = null;

const authMsg     = document.getElementById("authMsg");
const otpSection  = document.getElementById("otpSection");
const resendBtn   = document.getElementById("resendOtpBtn");
const countdownEl = document.getElementById("countdown");

function showMsg(text, isError) {
    authMsg.textContent   = text;
    authMsg.className     = "auth-msg " + (isError ? "auth-msg--error" : "auth-msg--success");
    authMsg.style.display = "block";
}

function startCountdown(seconds) {
    otpCountdown = seconds;
    countdownEl.textContent = otpCountdown;
    resendBtn.disabled      = true;
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        otpCountdown--;
        countdownEl.textContent = otpCountdown;
        if (otpCountdown <= 0) {
            clearInterval(countdownTimer);
            resendBtn.disabled    = false;
            resendBtn.textContent = "Resend OTP";
        }
    }, 1000);
}

// Step 1 — Register
document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const data = {
        name:     e.target.name.value,
        email:    e.target.email.value,
        phone:    e.target.phone.value,
        password: e.target.password.value
    };

    try {
        const res    = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            currentUserId = result.userId;
            document.getElementById("registerForm").style.display = "none";
            otpSection.style.display = "block";
            document.getElementById("otpHint").textContent =
                `OTP sent to ${data.email}. It expires in 5 minutes.`;
            showMsg(result.message || "Registration successful! Check your OTP.", false);
            startCountdown(60);
        } else {
            showMsg(result.message || "Registration failed.", true);
        }
    } catch (err) {
        showMsg("Network error. Please try again.", true);
        console.error(err);
    }
});

// Step 2 — Verify OTP
document.getElementById("verifyOtpBtn").addEventListener("click", async function () {
    const otp = document.getElementById("otpInput").value.trim();
    if (!otp) return showMsg("Please enter the OTP.", true);

    try {
        const res    = await fetch(`${API_BASE_URL}/api/otp/verify`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ userId: currentUserId, otp })
        });
        const result = await res.json();

        if (result.success) {
            showMsg("Account verified! Redirecting to login…", false);
            setTimeout(() => { window.location.href = "./login.html"; }, 1500);
        } else {
            showMsg(result.message || "Invalid OTP.", true);
        }
    } catch (err) {
        showMsg("Network error. Please try again.", true);
        console.error(err);
    }
});

// Resend OTP
resendBtn.addEventListener("click", async function () {
    if (otpCountdown > 0) return;
    try {
        const res    = await fetch(`${API_BASE_URL}/api/otp/resend`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ userId: currentUserId })
        });
        const result = await res.json();
        if (result.success) {
            showMsg("OTP resent!", false);
            startCountdown(60);
        } else {
            showMsg(result.message || "Could not resend OTP.", true);
        }
    } catch (err) {
        showMsg("Network error. Please try again.", true);
        console.error(err);
    }
});
