const express    = require('express');
const router     = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    toggleFavorite,
    getMyFavorites
} = require('../controllers/favoriteController');

// GET  /api/favorites/my          — paginated wishlist of logged-in user
router.get('/my', protect, getMyFavorites);

// POST /api/favorites/:productId/toggle — like / unlike a product
router.post('/:productId/toggle', protect, toggleFavorite);

module.exports = router;
