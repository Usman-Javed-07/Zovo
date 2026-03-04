const CouponService = require('../services/couponService');
const CartModel     = require('../models/cartModel');

class CouponController {

    /** POST /api/coupons/validate — user validates coupon at checkout */
    static async validate(req, res) {
        try {
            const { code, order_amount } = req.body;
            const userId = req.user.id;
            const result = await CouponService.validate(code, userId, Number(order_amount));
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /** GET /api/coupons — admin gets all coupons */
    static async getAll(req, res) {
        try {
            const coupons = await CouponService.getAll();
            res.json(coupons);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /** POST /api/coupons — admin creates coupon */
    static async create(req, res) {
        try {
            const id = await CouponService.create(req.body);
            res.json({ success: true, id });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /** PATCH /api/coupons/:id/toggle — admin toggles active */
    static async toggle(req, res) {
        try {
            await CouponService.toggleActive(req.params.id, req.body.is_active);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /** DELETE /api/coupons/:id — admin deletes coupon */
    static async remove(req, res) {
        try {
            await CouponService.remove(req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = CouponController;
