const express    = require('express');
const router     = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { rateProduct, getProductReviews, submitFeedback, getAllReviewsAdmin,
        hideReview, unhideReview, deleteReviewAdmin } = require('../controllers/ratingController');
const { authorize } = require('../middlewares/authMiddleware');

router.get('/admin/all',                  protect, authorize(['admin']), getAllReviewsAdmin);
router.patch('/admin/:reviewId/hide',     protect, authorize(['admin']), hideReview);
router.patch('/admin/:reviewId/unhide',   protect, authorize(['admin']), unhideReview);
router.delete('/admin/:reviewId',         protect, authorize(['admin']), deleteReviewAdmin);
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId', protect, rateProduct);
router.patch('/:productId/feedback', protect, submitFeedback);

module.exports = router;
