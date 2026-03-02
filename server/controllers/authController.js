const AuthService = require("../services/authService");
const UserModel   = require("../models/userModel");

class AuthController {
    static async register(req, res) {
        try {
            const { name, email, phone, password } = req.body;
            const image = req.file ? `/uploads/${req.file.filename}` : null;
            const result = await AuthService.register(name, email, phone, password, image);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async verifyOtp(req, res) {
        try {
            const { userId, otp } = req.body;
            const result = await AuthService.verifyOtp(userId, otp);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);

            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            res.json({ success: true, user: result.user, token: result.accessToken });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async refreshToken(req, res) {
        try {
            const oldToken = req.cookies.refreshToken;
            const result = await AuthService.refreshToken(oldToken);
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await UserModel.findById(req.user.id);
            res.json({ success: true, user });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async updateProfile(req, res) {
        try {
            const fields = {};
            if (req.body.name)  fields.name  = req.body.name;
            if (req.file)       fields.image = `/uploads/${req.file.filename}`;

            await UserModel.updateProfile(req.user.id, fields);
            const updated = await UserModel.findById(req.user.id);
            res.json({ success: true, user: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = AuthController;