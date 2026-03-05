const db = require('../config/db');

const RatingModel = {
    /** Insert or update a user's rating for a product */
    upsert: async (userId, productId, rating) => {
        await db.execute(
            `INSERT INTO product_ratings (user_id, product_id, rating)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = NOW()`,
            [userId, productId, rating]
        );
    },

    /** Get the average rating and count for a single product */
    getStats: async (productId) => {
        const [[row]] = await db.execute(
            `SELECT ROUND(COALESCE(AVG(rating), 0), 1) AS avg_rating,
                    COUNT(*) AS rating_count
             FROM product_ratings WHERE product_id = ?`,
            [productId]
        );
        return row;
    },

    /** Get the rating a specific user gave to a product (null if none) */
    getUserRating: async (userId, productId) => {
        const [rows] = await db.execute(
            'SELECT rating FROM product_ratings WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return rows.length ? rows[0].rating : null;
    },

    /**
     * Batch-fetch each user's rating for multiple products.
     * Returns a map { productId: userRating }
     */
    getUserRatingsBatch: async (userId, productIds) => {
        if (!productIds.length) return {};
        const placeholders = productIds.map(() => '?').join(',');
        const [rows] = await db.execute(
            `SELECT product_id, rating FROM product_ratings
             WHERE user_id = ? AND product_id IN (${placeholders})`,
            [userId, ...productIds]
        );
        const map = {};
        rows.forEach((r) => { map[r.product_id] = r.rating; });
        return map;
    },

    /** Save or update the feedback text on an existing rating */
    updateFeedback: async (userId, productId, feedback) => {
        await db.execute(
            `UPDATE product_ratings SET feedback = ?, updated_at = NOW()
             WHERE user_id = ? AND product_id = ?`,
            [feedback, userId, productId]
        );
    },

    /** All ratings across all products, newest first — for admin panel (includes hidden) */
    getAllReviews: async () => {
        const [rows] = await db.execute(
            `SELECT pr.id, pr.user_id, pr.rating, pr.feedback, pr.is_hidden, pr.updated_at,
                    u.name AS user_name, u.image AS user_image, u.email AS user_email,
                    p.id AS product_id, p.name AS product_name, p.image AS product_image
             FROM   product_ratings pr
             JOIN   users u ON u.id = pr.user_id
             JOIN   products p ON p.id = pr.product_id
             ORDER  BY pr.updated_at DESC`
        );
        return rows;
    },

    /** Hide a review by its id */
    hideReview: async (reviewId) => {
        await db.execute('UPDATE product_ratings SET is_hidden = 1 WHERE id = ?', [reviewId]);
    },

    /** Unhide a review by its id */
    unhideReview: async (reviewId) => {
        await db.execute('UPDATE product_ratings SET is_hidden = 0 WHERE id = ?', [reviewId]);
    },

    /**
     * Delete a review by its id.
     * Returns the user_id so the caller can send a notification.
     */
    deleteReview: async (reviewId) => {
        const [[row]] = await db.execute(
            'SELECT user_id FROM product_ratings WHERE id = ?', [reviewId]
        );
        if (!row) return null;
        await db.execute('DELETE FROM product_ratings WHERE id = ?', [reviewId]);
        return row.user_id;
    },

    /** All reviews with feedback text that are not hidden — for public product page */
    getProductReviews: async (productId) => {
        const [rows] = await db.execute(
            `SELECT pr.rating, pr.feedback, pr.updated_at, u.name AS user_name, u.image AS user_image
             FROM   product_ratings pr
             JOIN   users u ON u.id = pr.user_id
             WHERE  pr.product_id = ?
               AND  pr.feedback IS NOT NULL AND pr.feedback != ''
               AND  pr.is_hidden = 0
             ORDER  BY pr.updated_at DESC`,
            [productId]
        );
        return rows;
    }
};

module.exports = RatingModel;
