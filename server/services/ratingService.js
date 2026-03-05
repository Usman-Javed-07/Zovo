const RatingModel       = require('../models/ratingModel');
const NotificationModel = require('../models/notificationModel');
const db                = require('../config/db');

async function notifyAdmins(type, title, message) {
    const [admins] = await db.execute("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
        await NotificationModel.create(admin.id, type, title, message);
    }
}

/** Submit or update a rating (1–5). Validates product existence and purchase. */
exports.rateProduct = async (userId, productId, rating) => {
    if (rating < 1 || rating > 5) {
        const err = new Error('Rating must be between 1 and 5');
        err.status = 400;
        throw err;
    }

    const [products] = await db.execute('SELECT id FROM products WHERE id = ?', [productId]);
    if (!products.length) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    // Only allow rating if the user has a delivered order containing this product
    const [purchased] = await db.execute(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
         LIMIT 1`,
        [userId, productId]
    );
    if (!purchased.length) {
        const err = new Error('You can only rate products you have purchased and received');
        err.status = 403;
        throw err;
    }

    await RatingModel.upsert(userId, productId, rating);
    const stats = await RatingModel.getStats(productId);

    // Notify all admins of the new rating
    const [[product]] = await db.execute('SELECT name FROM products WHERE id = ?', [productId]);
    await notifyAdmins(
        'new_rating', 'New Rating',
        `A user rated "${product ? product.name : `Product #${productId}`}" ${rating}/5 stars`
    ).catch(() => {});

    return { ...stats, user_rating: rating, productId };
};

/** Submit optional feedback text on an already-rated product */
exports.submitFeedback = async (userId, productId, feedback) => {
    const existing = await RatingModel.getUserRating(userId, productId);
    if (!existing) {
        const err = new Error('Rate the product first before leaving a review');
        err.status = 400;
        throw err;
    }
    await RatingModel.updateFeedback(userId, productId, feedback);

    // Notify all admins of the new written review
    const [[product]] = await db.execute('SELECT name FROM products WHERE id = ?', [productId]);
    await notifyAdmins(
        'new_review', 'New Review',
        `A user posted a written review for "${product ? product.name : `Product #${productId}`}"`
    ).catch(() => {});
};

/** All reviews (with feedback) for a product, plus the product name */
exports.getProductReviews = async (productId) => {
    const [products] = await db.execute('SELECT id, name FROM products WHERE id = ?', [productId]);
    if (!products.length) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }
    const reviews = await RatingModel.getProductReviews(productId);
    return { product: products[0], reviews };
};

/**
 * Attach avg_rating, rating_count, and user_rating to an array of products.
 * avg_rating and rating_count are already on the product objects (from productModel JOIN),
 * this only adds the per-user rating in one batched query.
 */
exports.enrichProductsWithUserRatings = async (products, userId) => {
    if (!products.length) return products;
    if (!userId) return products.map((p) => ({ ...p, user_rating: null }));

    const productIds   = products.map((p) => p.id);
    const userRatings  = await RatingModel.getUserRatingsBatch(userId, productIds);

    return products.map((p) => ({
        ...p,
        user_rating: userRatings[p.id] || null
    }));
};
