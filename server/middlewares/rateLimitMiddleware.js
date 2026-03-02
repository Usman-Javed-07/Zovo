const rateLimit = require("express-rate-limit");

// For OTP resend — strict: max 3 resends per 10 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000);
        res.status(429).json({
            success: false,
            message: `Too many OTP requests. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before trying again.`
        });
    }
});

// For registration — relaxed: max 10 per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many registration attempts. Please try again in an hour."
        });
    }
});

// For login — max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many login attempts. Please wait 15 minutes before trying again."
        });
    }
});

module.exports = { otpLimiter, registerLimiter, loginLimiter };
