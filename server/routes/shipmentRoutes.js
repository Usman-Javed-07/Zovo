const express       = require('express');
const router        = express.Router();
const ShipmentCtrl  = require('../controllers/shipmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// User: track their order shipment
router.get('/order/:orderId', protect, ShipmentCtrl.getByOrder);

// Admin
router.post('/',                   protect, authorize(['admin']), ShipmentCtrl.create);
router.get('/',                    protect, authorize(['admin']), ShipmentCtrl.getAll);
router.patch('/order/:orderId',    protect, authorize(['admin']), ShipmentCtrl.update);

module.exports = router;
