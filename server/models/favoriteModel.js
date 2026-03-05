const db = require('../config/db');

const FavoriteModel = {
    /**
     * Toggle favorite: inserts if not exists, deletes if exists.
     * Returns { action: 'liked' | 'unliked' }
     */
    toggle: async (userId, productId) => {
        const [rows] = await db.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (rows.length > 0) {
            await db.execute(
                'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
                [userId, productId]
            );
            return { action: 'unliked' };
        }

        await db.execute(
            'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
            [userId, productId]
        );
        return { action: 'liked' };
    },

    /** Count total likes for a product */
    getLikeCount: async (productId) => {
        const [[row]] = await db.execute(
            'SELECT COUNT(*) AS count FROM favorites WHERE product_id = ?',
            [productId]
        );
        return row.count;
    },

    /** Check if a user has liked a product */
    isLiked: async (userId, productId) => {
        const [rows] = await db.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return rows.length > 0;
    },

    /**
     * Get paginated favorites for a user, newest first.
     * Returns { products, total, page, limit }
     */
    getUserFavorites: async (userId, page = 1, limit = 12) => {
        const offset = (page - 1) * limit;

        const [products] = await db.execute(
            `SELECT p.id, p.name, p.description, p.material, p.price, p.image, p.created_at,
                    ROUND(COALESCE(AVG(r.rating), 0), 1)                        AS avg_rating,
                    COUNT(r.id)                                                  AS rating_count,
                    (SELECT COUNT(*) FROM favorites WHERE product_id = p.id)    AS like_count,
                    1                                                            AS is_liked_by_user,
                    f.created_at                                                 AS liked_at
             FROM   favorites f
             JOIN   products  p ON p.id = f.product_id
             LEFT   JOIN product_ratings r ON r.product_id = p.id
             WHERE  f.user_id = ?
             GROUP  BY p.id, f.created_at
             ORDER  BY f.created_at DESC
             LIMIT  ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await db.execute(
            'SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?',
            [userId]
        );

        return { products, total, page, limit };
    },

    /**
     * Batch-fetch like counts for multiple product IDs.
     * Returns a map { productId: likeCount }
     */
    getLikeCountsBatch: async (productIds) => {
        if (!productIds.length) return {};

        const placeholders = productIds.map(() => '?').join(',');
        const [rows] = await db.execute(
            `SELECT product_id, COUNT(*) AS like_count
             FROM   favorites
             WHERE  product_id IN (${placeholders})
             GROUP  BY product_id`,
            productIds
        );

        const map = {};
        rows.forEach((r) => { map[r.product_id] = r.like_count; });
        return map;
    },

    /**
     * Return the Set of product IDs that a user has liked,
     * filtered to the provided product ID list.
     */
    getUserLikedProductIds: async (userId, productIds) => {
        if (!productIds.length) return new Set();

        const placeholders = productIds.map(() => '?').join(',');
        const [rows] = await db.execute(
            `SELECT product_id
             FROM   favorites
             WHERE  user_id    = ?
               AND  product_id IN (${placeholders})`,
            [userId, ...productIds]
        );

        return new Set(rows.map((r) => r.product_id));
    }
};

module.exports = FavoriteModel;
