require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const cookieParser = require('cookie-parser');

const productRoutes  = require('./routes/productRoutes');
const cartRoutes     = require('./routes/cartRoutes');
const authRoutes     = require('./routes/authRoutes');
const otpRoutes      = require('./routes/otpRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const couponRoutes   = require('./routes/couponRoutes');
const walletRoutes   = require('./routes/walletRoutes');
const refundRoutes   = require('./routes/refundRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const stripeRoutes     = require('./routes/stripeRoutes');   // must be before express.json()
const favoriteRoutes      = require('./routes/favoriteRoutes');
const ratingRoutes        = require('./routes/ratingRoutes');
const contactRoutes       = require('./routes/contactRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');
const adminUserRoutes     = require('./routes/adminUserRoutes');

const { protect } = require('./middlewares/authMiddleware');

const app = express();

// ── Stripe webhook MUST come before express.json() ──
app.use('/api/stripe', stripeRoutes);

// ── Core middleware ──
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Static uploads ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
app.use('/api/auth',      authRoutes);
app.use('/api/otp',       otpRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/coupons',   couponRoutes);
app.use('/api/wallet',    walletRoutes);
app.use('/api/refunds',   refundRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/favorites',      favoriteRoutes);
app.use('/api/ratings',        ratingRoutes);
app.use('/api/contact',        contactRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/admin/users',    adminUserRoutes);

// ── Test protected route ──
app.get('/api/protected', protect, (req, res) => {
    res.json({ message: 'You are authenticated', user: req.user });
});

module.exports = app;
