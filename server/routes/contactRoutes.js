const express    = require('express');
const router     = express.Router();
const { optionalAuth, protect, authorize } = require('../middlewares/authMiddleware');
const { sendMessage, getAllMessages, replyToMessage } = require('../controllers/contactController');

router.post('/',                 optionalAuth, sendMessage);
router.get('/admin',             protect, authorize(['admin']), getAllMessages);
router.post('/admin/:id/reply',  protect, authorize(['admin']), replyToMessage);

module.exports = router;
