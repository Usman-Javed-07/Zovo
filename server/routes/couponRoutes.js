const express      = require('express');
const router       = express.Router();
const CouponCtrl   = require('../controllers/couponController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// User: validate coupon
router.post('/validate', protect, CouponCtrl.validate);

// Admin
router.get('/',                protect, authorize(['admin']), CouponCtrl.getAll);
router.post('/',               protect, authorize(['admin']), CouponCtrl.create);
router.patch('/:id/toggle',    protect, authorize(['admin']), CouponCtrl.toggle);
router.delete('/:id',          protect, authorize(['admin']), CouponCtrl.remove);

module.exports = router;
