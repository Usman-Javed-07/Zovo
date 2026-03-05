const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        if (user.is_banned) {
            return res.status(403).json({
                message: user.ban_reason || "Your account has been suspended.",
                banned: true
            });
        }

        req.user = user; // attach user info to request
        next();

    } catch (error) {
        res.status(401).json({ message: "Not authorized" });
    }
};

// Role-based authorization
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};

// Soft auth: attaches req.user if token valid, but never rejects
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token   = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user    = await UserModel.findById(decoded.id);
            if (user) req.user = user;
        }
    } catch (_) {}
    next();
};

module.exports = { protect, authorize, optionalAuth };