const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");

const { protect } = require("./middlewares/authMiddleware");

const app = express();

// Middleware
app.use(cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/products', productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);         // register/login/refresh token
app.use("/api/otp", otpRoutes);           // otp verify & resend

// Optional: test protected route
app.get("/api/protected", protect, (req, res) => {
    res.json({ message: "You are authenticated", user: req.user });
});

module.exports = app;