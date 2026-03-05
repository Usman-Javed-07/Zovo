const favoriteService = require('../services/favoriteService');
const { getIO } = require('../config/socket');

/** POST /api/favorites/:productId/toggle — requires auth */
exports.toggleFavorite = async (req, res) => {
    try {
        const userId    = req.user.id;
        const productId = parseInt(req.params.productId, 10);

        if (!productId || isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const result = await favoriteService.toggleFavorite(userId, productId);

        // Broadcast real-time like count to all viewers of this product
        try {
            const io = getIO();
            io.to(`product_${productId}`).emit('like_update', {
                productId: result.productId,
                likeCount: result.likeCount,
                action:    result.action
            });
        } catch (_) {
            // Socket not critical — swallow
        }

        return res.json({
            success: true,
            message: result.action === 'liked' ? 'Added to favorites' : 'Removed from favorites',
            data:    result
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        console.error('[favoriteController.toggleFavorite]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** GET /api/favorites/my?page=1&limit=12 — requires auth */
exports.getMyFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit  = Math.min(50, parseInt(req.query.limit, 10) || 12);

        const data = await favoriteService.getUserFavorites(userId, page, limit);

        return res.json({ success: true, data });
    } catch (err) {
        console.error('[favoriteController.getMyFavorites]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
