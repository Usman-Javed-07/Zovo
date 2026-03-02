const express = require("express");
const router = express.Router();
const OtpController = require("../controllers/otpController");
const { otpLimiter } = require("../middlewares/rateLimitMiddleware");

// Verify OTP
router.post("/verify", OtpController.verifyOtp);

// Resend OTP
router.post("/resend", otpLimiter, OtpController.resendOtp);

module.exports = router;