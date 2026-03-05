const FavoriteModel  = require('../models/favoriteModel');
const ratingService  = require('./ratingService');
const db = require('../config/db');

/**
 * Toggle a product favorite for a user.
 * Validates product existence, then delegates to model.
 * Returns { action, likeCount, productId }
 */
exports.toggleFavorite = async (userId, productId) => {
    const [products] = await db.execute('SELECT id FROM products WHERE id = ?', [productId]);
    if (!products.length) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    const result = await FavoriteModel.toggle(userId, productId);
    const likeCount = await FavoriteModel.getLikeCount(productId);
    return { ...result, likeCount, productId };
};

/**
 * Get paginated wishlist for a user.
 */
exports.getUserFavorites = async (userId, page, limit) => {
    const data = await FavoriteModel.getUserFavorites(userId, page, limit);
    data.products = await ratingService.enrichProductsWithUserRatings(data.products, userId);
    return data;
};

/**
 * Attach like_count and is_liked_by_user to an array of plain product objects.
 * Runs two batched queries — no N+1.
 */
exports.enrichProductsWithFavorites = async (products, userId) => {
    if (!products.length) return products;

    const productIds = products.map((p) => p.id);
    const likeCountsMap = await FavoriteModel.getLikeCountsBatch(productIds);
    const likedSet = userId
        ? await FavoriteModel.getUserLikedProductIds(userId, productIds)
        : new Set();

    return products.map((p) => ({
        ...p,
        like_count: likeCountsMap[p.id] || 0,
        is_liked_by_user: likedSet.has(p.id)
    }));
};
