const express     = require('express');
const router      = express.Router();
const WalletCtrl  = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/balance',  protect, WalletCtrl.getBalance);
router.get('/history',  protect, WalletCtrl.getHistory);

module.exports = router;
