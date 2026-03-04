const express      = require('express');
const router       = express.Router();
const StripeCtrl   = require('../controllers/stripeController');

// Stripe sends raw body — express.raw() applied here only
router.post('/webhook',
    express.raw({ type: 'application/json' }),
    StripeCtrl.webhook
);

module.exports = router;
