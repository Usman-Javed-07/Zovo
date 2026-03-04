const stripe     = require('../config/stripe');
const OrderModel = require('../models/orderModel');

class StripeService {

    static async createCheckoutSession(order, items, successUrl, cancelUrl) {
        const lineItems = items.map(item => ({
            price_data: {
                currency:     'usd',
                product_data: { name: item.product_name },
                unit_amount:  Math.round(item.price * 100)
            },
            quantity: item.quantity
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items:           lineItems,
            mode:                 'payment',
            success_url:          successUrl,
            cancel_url:           cancelUrl,
            metadata:             { order_id: String(order.id) }
        });

        await OrderModel.updateStripeSession(order.id, session.id);
        return session.url;
    }

    /**
     * Verifies Stripe webhook signature and returns the event.
     * Uses raw body so must be called with express.raw() route.
     */
    static constructEvent(rawBody, signature) {
        return stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    }

    static async handleWebhookEvent(event) {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const order   = await OrderModel.findByStripeSession(session.id);
            if (order) {
                await OrderModel.updatePaymentStatus(order.id, 'paid');
                await OrderModel.updateStatus(order.id, 'confirmed');
            }
        }
    }
}

module.exports = StripeService;
