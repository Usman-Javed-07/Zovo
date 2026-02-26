const CartModel = require("../models/cartModel");

class CartService {

    static async addToCart(userId, productId) {
        const existing = await CartModel.findItem(userId, productId);

        if (existing) {
            return CartModel.increaseQuantity(userId, productId);
        }

        return CartModel.createItem(userId, productId);
    }

    static async updateCart(userId, productId, quantity) {
        if (quantity <= 0) {
            return CartModel.removeItem(userId, productId);
        }

        return CartModel.updateQuantity(userId, productId, quantity);
    }

    static async removeFromCart(userId, productId) {
        return CartModel.removeItem(userId, productId);
    }

    static async getUserCart(userId) {
        return CartModel.getCart(userId);
    }

    static async getUserCartCount(userId) {
        return CartModel.getCartCount(userId);
    }
}

module.exports = CartService;