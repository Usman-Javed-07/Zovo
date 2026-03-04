const StripeService = require('../services/stripeService');

class StripeController {

    /**
     * POST /api/stripe/webhook
     * Called by Stripe — uses raw body (express.raw middleware applied in routes)
     */
    static async webhook(req, res) {
        const sig = req.headers['stripe-signature'];
        try {
            const event = StripeService.constructEvent(req.body, sig);
            await StripeService.handleWebhookEvent(event);
            res.json({ received: true });
        } catch (error) {
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }
}

module.exports = StripeController;
