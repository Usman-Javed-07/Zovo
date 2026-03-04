-- ============================================================
-- ZOVO eCommerce - New Tables SQL Schema
-- Run this AFTER the existing tables (users, products, cart, otps, refresh_tokens) are created
-- ============================================================

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    wallet_used     DECIMAL(10,2) DEFAULT 0.00,
    final_amount    DECIMAL(10,2) NOT NULL,
    payment_method  ENUM('cod','stripe') DEFAULT 'cod',
    payment_status  ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
    order_status    ENUM('processing','confirmed','shipped','delivered','cancelled') DEFAULT 'processing',
    shipping_name   VARCHAR(255) NOT NULL,
    shipping_phone  VARCHAR(20)  NOT NULL,
    shipping_address TEXT        NOT NULL,
    shipping_city   VARCHAR(100) NOT NULL,
    coupon_code     VARCHAR(50)  DEFAULT NULL,
    stripe_session_id VARCHAR(255) DEFAULT NULL,
    notes           TEXT         DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    product_id    INT NOT NULL,
    product_name  VARCHAR(255) NOT NULL,
    product_image VARCHAR(255) DEFAULT NULL,
    price         DECIMAL(10,2) NOT NULL,
    quantity      INT NOT NULL,
    subtotal      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    discount_type   ENUM('percentage','fixed') NOT NULL,
    discount_value  DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_uses        INT DEFAULT NULL,
    used_count      INT DEFAULT 0,
    expires_at      TIMESTAMP NULL DEFAULT NULL,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupon Usage (one row per user-per-order usage)
CREATE TABLE IF NOT EXISTS coupon_usage (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id  INT NOT NULL,
    user_id    INT NOT NULL,
    order_id   INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (order_id)  REFERENCES orders(id)  ON DELETE CASCADE
);

-- Wallets (one per user)
CREATE TABLE IF NOT EXISTS wallets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNIQUE NOT NULL,
    balance    DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id      INT NOT NULL,
    user_id        INT NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    type           ENUM('credit','debit') NOT NULL,
    description    VARCHAR(255) DEFAULT NULL,
    reference_id   INT DEFAULT NULL,
    reference_type ENUM('order','refund','manual') DEFAULT 'manual',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    order_id         INT NOT NULL,
    user_id          INT NOT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    reason           TEXT DEFAULT NULL,
    status           ENUM('pending','approved','rejected') DEFAULT 'pending',
    refund_method    ENUM('stripe','wallet') DEFAULT 'wallet',
    stripe_refund_id VARCHAR(255) DEFAULT NULL,
    admin_notes      TEXT DEFAULT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    order_id           INT UNIQUE NOT NULL,
    courier_name       VARCHAR(100) DEFAULT NULL,
    tracking_number    VARCHAR(255) DEFAULT NULL,
    status             ENUM('pending','picked_up','in_transit','delivered','returned') DEFAULT 'pending',
    estimated_delivery DATE DEFAULT NULL,
    notes              TEXT DEFAULT NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Sample admin coupon
INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active)
VALUES ('WELCOME10', 'percentage', 10.00, 50.00, 100, DATE_ADD(NOW(), INTERVAL 1 YEAR), 1);

INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active)
VALUES ('FLAT20', 'fixed', 20.00, 100.00, 50, DATE_ADD(NOW(), INTERVAL 6 MONTH), 1);
