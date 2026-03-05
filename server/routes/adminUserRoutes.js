const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getAllUsers, banUser, unbanUser, deleteUser } = require('../controllers/adminUserController');

router.get('/',                protect, authorize(['admin']), getAllUsers);
router.patch('/:userId/ban',   protect, authorize(['admin']), banUser);
router.patch('/:userId/unban', protect, authorize(['admin']), unbanUser);
router.delete('/:userId',      protect, authorize(['admin']), deleteUser);

module.exports = router;
