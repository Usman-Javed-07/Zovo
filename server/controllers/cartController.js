const CartService = require("../services/cartService");

class CartController {

    static async add(req, res) {
        try {
            const userId = req.user?.id || 1; // fallback if no auth
            const { productId } = req.body;

            await CartService.addToCart(userId, productId);

            res.json({ success: true, message: "Added to cart" });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const userId = req.user?.id || 1;
            const { productId, quantity } = req.body;

            await CartService.updateCart(userId, productId, quantity);

            res.json({ success: true });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async remove(req, res) {
        try {
            const userId = req.user?.id || 1;
            const { productId } = req.params;

            await CartService.removeFromCart(userId, productId);

            res.json({ success: true });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getCart(req, res) {
        try {
            const userId = req.user?.id || 1;

            const cart = await CartService.getUserCart(userId);

            res.json(cart);

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getCount(req, res) {
        try {
            const userId = req.user?.id || 1;

            const count = await CartService.getUserCartCount(userId);

            res.json({ count });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = CartController;