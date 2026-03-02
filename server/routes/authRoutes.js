const express    = require("express");
const router     = express.Router();
const multer     = require("multer");
const path       = require("path");
const AuthController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { registerLimiter, loginLimiter } = require("../middlewares/rateLimitMiddleware");

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/"),
    filename:    (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
    }
});

router.post("/register",      registerLimiter, AuthController.register);
router.post("/verify-otp",    AuthController.verifyOtp);
router.post("/login",         loginLimiter, AuthController.login);
router.get("/refresh-token",  AuthController.refreshToken);
router.get("/profile",        protect, AuthController.getProfile);
router.put("/profile",        protect, upload.single("image"), AuthController.updateProfile);

module.exports = router;