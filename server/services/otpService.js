const UserModel  = require("../models/userModel");
const OtpModel   = require("../models/otpModel");
const generateOTP = require("../utils/generateOTP");
const nodemailer  = require("nodemailer");

class OtpService {

    static async verifyOtp(userId, otp) {
        const validOtp = await OtpModel.findValidOtp(userId, otp);
        if (!validOtp) throw new Error("Invalid or expired OTP");

        await OtpModel.markVerified(validOtp.id);
        await UserModel.markVerified(userId);

        return { message: "Account verified successfully" };
    }

    static async resendOtp(userId) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error("User not found");

        const otp       = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await OtpModel.create(userId, otp, expiresAt);

        await OtpService.sendEmailOTP(user.email, otp);

        return { message: "OTP resent successfully" };
    }

    static async sendEmailOTP(email, otp) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp} (valid for 5 minutes)`
        });
    }
}

module.exports = OtpService;