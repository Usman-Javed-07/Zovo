const express     = require('express');
const router      = express.Router();
const RefundCtrl  = require('../controllers/refundController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// User
router.post('/',       protect, RefundCtrl.request);
router.get('/my',      protect, RefundCtrl.getUserRefunds);

// Admin
router.get('/',        protect, authorize(['admin']), RefundCtrl.getAllRefunds);
router.patch('/:id',   protect, authorize(['admin']), RefundCtrl.processRefund);

module.exports = router;
