const ratingService = require('../services/ratingService');
const RatingModel   = require('../models/ratingModel');
const { getIO }     = require('../config/socket');

/** GET /api/ratings/:productId/reviews */
exports.getProductReviews = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        if (!productId) return res.status(400).json({ success: false, message: 'Invalid product ID' });
        const data = await ratingService.getProductReviews(productId);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        console.error('[ratingController.getProductReviews]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** PATCH /api/ratings/:productId/feedback  body: { feedback } */
exports.submitFeedback = async (req, res) => {
    try {
        const userId    = req.user.id;
        const productId = parseInt(req.params.productId, 10);
        const { feedback } = req.body;
        if (!productId) return res.status(400).json({ success: false, message: 'Invalid product ID' });
        if (!feedback || !feedback.trim()) return res.status(400).json({ success: false, message: 'Feedback text is required' });
        await ratingService.submitFeedback(userId, productId, feedback.trim());
        return res.json({ success: true, message: 'Review submitted' });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        console.error('[ratingController.submitFeedback]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** PATCH /api/ratings/admin/:reviewId/hide */
exports.hideReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        const NotificationModel = require('../models/notificationModel');

        // Get user_id before hiding so we can notify them
        const [[row]] = await require('../config/db').execute(
            'SELECT user_id FROM product_ratings WHERE id = ?', [reviewId]
        );
        if (!row) return res.status(404).json({ success: false, message: 'Review not found' });

        await RatingModel.hideReview(reviewId);
        await NotificationModel.create(
            row.user_id, 'review_hidden', 'Review Hidden',
            'Your review has been hidden by an admin and is no longer visible to other users.'
        );
        return res.json({ success: true, message: 'Review hidden' });
    } catch (err) {
        console.error('[ratingController.hideReview]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** PATCH /api/ratings/admin/:reviewId/unhide */
exports.unhideReview = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        const NotificationModel = require('../models/notificationModel');

        const [[row]] = await require('../config/db').execute(
            'SELECT user_id FROM product_ratings WHERE id = ?', [reviewId]
        );
        if (!row) return res.status(404).json({ success: false, message: 'Review not found' });

        await RatingModel.unhideReview(reviewId);
        await NotificationModel.create(
            row.user_id, 'review_restored', 'Review Restored',
            'Your review has been made visible again by an admin.'
        );
        return res.json({ success: true, message: 'Review restored' });
    } catch (err) {
        console.error('[ratingController.unhideReview]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** DELETE /api/ratings/admin/:reviewId */
exports.deleteReviewAdmin = async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        const NotificationModel = require('../models/notificationModel');

        const userId = await RatingModel.deleteReview(reviewId);
        if (!userId) return res.status(404).json({ success: false, message: 'Review not found' });

        await NotificationModel.create(
            userId, 'review_deleted', 'Review Removed',
            'Your review has been removed by an admin for violating our community guidelines.'
        );
        return res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('[ratingController.deleteReviewAdmin]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** GET /api/ratings/admin/all */
exports.getAllReviewsAdmin = async (_req, res) => {
    try {
        const RatingModel = require('../models/ratingModel');
        const rows = await RatingModel.getAllReviews();
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[ratingController.getAllReviewsAdmin]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/** POST /api/ratings/:productId  body: { rating: 1-5 } */
exports.rateProduct = async (req, res) => {
    try {
        const userId    = req.user.id;
        const productId = parseInt(req.params.productId, 10);
        const rating    = parseInt(req.body.rating, 10);

        if (!productId || isNaN(productId)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        if (!rating || isNaN(rating)) {
            return res.status(400).json({ success: false, message: 'Rating is required' });
        }

        const result = await ratingService.rateProduct(userId, productId, rating);

        // Broadcast updated stats to all viewers of this product
        try {
            const io = getIO();
            io.to(`product_${productId}`).emit('rating_update', {
                productId:    result.productId,
                avgRating:    result.avg_rating,
                ratingCount:  result.rating_count
            });
        } catch (_) {}

        return res.json({ success: true, data: result });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        console.error('[ratingController.rateProduct]', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
