const RefundModel  = require('../models/refundModel');
const OrderModel   = require('../models/orderModel');
const WalletModel  = require('../models/walletModel');
const stripe       = require('../config/stripe');

class RefundService {

    static async requestRefund(userId, data) {
        const { order_id, amount, reason, refund_method } = data;

        const order = await OrderModel.findById(order_id);
        if (!order) throw new Error('Order not found');
        if (order.user_id !== userId) throw new Error('Unauthorized');
        if (['processing', 'confirmed'].includes(order.order_status))
            throw new Error('You can only request a refund for shipped or delivered orders');

        const existing = await RefundModel.findByOrder(order_id);
        if (existing) throw new Error('A refund request already exists for this order');

        const id = await RefundModel.create({
            order_id, user_id: userId, amount, reason,
            refund_method: refund_method || 'wallet'
        });
        return id;
    }

    static async getUserRefunds(userId) {
        return RefundModel.findByUser(userId);
    }

    static async getAllRefunds() {
        return RefundModel.findAll();
    }

    static async processRefund(refundId, status, admin_notes, refund_method) {
        const refund = await RefundModel.findById(refundId);
        if (!refund) throw new Error('Refund not found');
        if (refund.status !== 'pending') throw new Error('Refund already processed');

        let stripe_refund_id = null;
        const method = refund_method || refund.refund_method;

        if (status === 'approved') {
            if (method === 'stripe' && refund.stripe_session_id) {
                // Retrieve payment intent from session, then refund
                try {
                    const session = await stripe.checkout.sessions.retrieve(refund.stripe_session_id);
                    const stripeRefund = await stripe.refunds.create({
                        payment_intent: session.payment_intent,
                        amount: Math.round(refund.amount * 100)
                    });
                    stripe_refund_id = stripeRefund.id;
                    await OrderModel.updatePaymentStatus(refund.order_id, 'refunded');
                } catch (err) {
                    throw new Error(`Stripe refund failed: ${err.message}`);
                }
            } else {
                // Refund to wallet
                const wallet = await WalletModel.getOrCreate(refund.user_id);
                await WalletModel.credit(refund.user_id, refund.amount);
                await WalletModel.addTransaction({
                    wallet_id:      wallet.id,
                    user_id:        refund.user_id,
                    amount:         refund.amount,
                    type:           'credit',
                    description:    `Refund for Order #${refund.order_id}`,
                    reference_id:   refund.order_id,
                    reference_type: 'refund'
                });
                await OrderModel.updatePaymentStatus(refund.order_id, 'refunded');
            }
        }

        await RefundModel.updateStatus(refundId, status, admin_notes, stripe_refund_id);
        return { status, stripe_refund_id };
    }
}

module.exports = RefundService;
