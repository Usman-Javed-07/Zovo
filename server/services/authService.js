const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel");
const OtpModel = require("../models/otpModel");
const RefreshTokenModel = require("../models/refreshTokenModel");
const generateOTP = require("../utils/generateOTP");
const { generateToken, generateRefreshToken } = require("../utils/generateToken");
const nodemailer = require("nodemailer");

class AuthService {

    static async register(name, email, phone, password, image) {
        const existing = await UserModel.findByEmail(email);
        if (existing) throw new Error("Email already exists");

        const hashed = await bcrypt.hash(password, 10);
        const userId = await UserModel.createUser(name, email, hashed, image, phone);

        const otp       = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await OtpModel.create(userId, otp, expiresAt);

        await AuthService.sendEmailOTP(email, otp);

        return { message: "OTP sent to your email", userId };
    }

    static async verifyOtp(userId, otp) {
        const validOtp = await OtpModel.findValidOtp(userId, otp);
        if (!validOtp) throw new Error("Invalid or expired OTP");

        await OtpModel.markVerified(validOtp.id);
        await UserModel.markVerified(userId);

        return { message: "Account verified successfully" };
    }

    static async login(email, password) {
        const user = await UserModel.findByEmail(email);
        if (!user) throw new Error("Invalid credentials");
        if (!user.is_verified) throw new Error("Please verify your account first");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials");

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

        const { password: _pwd, ...safeUser } = user;
        return { user: safeUser, accessToken, refreshToken };
    }

    static async refreshToken(oldToken) {
        const dbToken = await RefreshTokenModel.find(oldToken);
        if (!dbToken) throw new Error("Invalid refresh token");

        const user = await UserModel.findById(dbToken.user_id);
        if (!user) throw new Error("User not found");

        const newAccessToken = generateToken(user);
        return { accessToken: newAccessToken };
    }

    static async sendEmailOTP(email, otp) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP",
            text: `Your OTP is ${otp} (expires in 5 minutes)`
        });
    }
}

module.exports = AuthService;