const OtpService = require("../services/otpService");

class OtpController {

    // Verify OTP
    static async verifyOtp(req, res) {
        try {
            const { userId, otp } = req.body;
            const result = await OtpService.verifyOtp(userId, otp);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Resend OTP
    static async resendOtp(req, res) {
        try {
            const { userId } = req.body;
            const result = await OtpService.resendOtp(userId);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = OtpController;