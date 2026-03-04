const OrderModel   = require('../models/orderModel');
const CartModel    = require('../models/cartModel');
const CouponModel  = require('../models/couponModel');
const WalletModel  = require('../models/walletModel');

class OrderService {

    static async placeOrder(userId, body) {
        const {
            shipping_name, shipping_phone, shipping_address, shipping_city,
            payment_method, coupon_code, use_wallet, notes
        } = body;

        // 1 — Load cart
        const cartItems = await CartModel.getCart(userId);
        if (!cartItems.length) throw new Error('Cart is empty');

        // 2 — Calculate totals
        let total_amount = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        let discount_amount = 0;
        let coupon = null;

        // 3 — Apply coupon
        if (coupon_code) {
            coupon = await CouponModel.findByCode(coupon_code);
            if (!coupon) throw new Error('Invalid or expired coupon');
            if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
                throw new Error('Coupon has expired');
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
                throw new Error('Coupon usage limit reached');
            if (total_amount < coupon.min_order_amount)
                throw new Error(`Minimum order of $${coupon.min_order_amount} required`);

            const alreadyUsed = await CouponModel.hasUserUsed(coupon.id, userId);
            if (alreadyUsed) throw new Error('You have already used this coupon');

            if (coupon.discount_type === 'percentage') {
                discount_amount = (total_amount * coupon.discount_value) / 100;
            } else {
                discount_amount = Math.min(coupon.discount_value, total_amount);
            }
        }

        // 4 — Apply wallet
        let wallet_used = 0;
        if (use_wallet) {
            const wallet = await WalletModel.getOrCreate(userId);
            const afterDiscount = total_amount - discount_amount;
            wallet_used = Math.min(Number(wallet.balance), afterDiscount);
        }

        const final_amount = Math.max(0, total_amount - discount_amount - wallet_used);

        // 5 — Create order
        const orderId = await OrderModel.create({
            user_id: userId,
            total_amount,
            discount_amount,
            wallet_used,
            final_amount,
            payment_method: payment_method || 'cod',
            shipping_name,
            shipping_phone,
            shipping_address,
            shipping_city,
            coupon_code: coupon ? coupon.code : null,
            notes
        });

        // 6 — Insert order items
        const items = cartItems.map(i => ({
            order_id:      orderId,
            product_id:    i.id,
            product_name:  i.name,
            product_image: i.image,
            price:         i.price,
            quantity:      i.quantity,
            subtotal:      i.price * i.quantity
        }));
        await OrderModel.insertItems(items);

        // 7 — Deduct wallet
        if (wallet_used > 0) {
            const wallet = await WalletModel.getOrCreate(userId);
            await WalletModel.debit(userId, wallet_used);
            await WalletModel.addTransaction({
                wallet_id:      wallet.id,
                user_id:        userId,
                amount:         wallet_used,
                type:           'debit',
                description:    `Payment for Order #${orderId}`,
                reference_id:   orderId,
                reference_type: 'order'
            });
        }

        // 8 — Record coupon usage
        if (coupon) {
            await CouponModel.incrementUsed(coupon.id);
            await CouponModel.recordUsage(coupon.id, userId, orderId);
        }

        // 9 — Clear cart
        await CartModel.clearCart(userId);

        return { orderId, final_amount };
    }

    static async getUserOrders(userId) {
        const orders = await OrderModel.findByUser(userId);
        for (const order of orders) {
            order.items = await OrderModel.getItems(order.id);
        }
        return orders;
    }

    static async getOrderDetail(orderId, userId, isAdmin) {
        const order = await OrderModel.findById(orderId);
        if (!order) throw new Error('Order not found');
        if (!isAdmin && order.user_id !== userId) throw new Error('Unauthorized');
        order.items = await OrderModel.getItems(orderId);
        return order;
    }

    static async updateOrderStatus(orderId, order_status) {
        const existing = await OrderModel.findById(orderId);
        if (!existing) throw new Error('Order not found');

        if (existing.order_status === 'delivered') {
            throw new Error('Cannot change status of a delivered order');
        }
        if (existing.order_status === 'cancelled') {
            throw new Error('Cannot change status of a cancelled order');
        }

        await OrderModel.updateStatus(orderId, order_status);

        // Auto-mark COD payment as paid when delivered
        if (order_status === 'delivered' && existing.payment_method === 'cod') {
            await OrderModel.updatePaymentStatus(orderId, 'paid');
        }

        const order = await OrderModel.findById(orderId);
        return order;
    }
}

module.exports = OrderService;
