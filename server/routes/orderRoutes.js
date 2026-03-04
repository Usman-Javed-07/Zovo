const express    = require('express');
const router     = express.Router();
const OrderCtrl  = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// User routes
router.post('/',              protect, OrderCtrl.placeOrder);
router.get('/my',             protect, OrderCtrl.getUserOrders);
router.get('/:id',            protect, OrderCtrl.getOrderDetail);
router.get('/:id/invoice',    protect, OrderCtrl.downloadInvoice);

// Admin routes
router.get('/',               protect, authorize(['admin']), OrderCtrl.getAllOrders);
router.patch('/:id/status',   protect, authorize(['admin']), OrderCtrl.updateStatus);

module.exports = router;
