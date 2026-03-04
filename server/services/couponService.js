const CouponModel = require('../models/couponModel');

class CouponService {

    static async validate(code, userId, orderAmount) {
        const coupon = await CouponModel.findByCode(code);
        if (!coupon) throw new Error('Invalid or expired coupon');

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
            throw new Error('Coupon has expired');
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
            throw new Error('Coupon usage limit reached');
        if (orderAmount < coupon.min_order_amount)
            throw new Error(`Minimum order amount is $${coupon.min_order_amount}`);

        const alreadyUsed = await CouponModel.hasUserUsed(coupon.id, userId);
        if (alreadyUsed) throw new Error('You have already used this coupon');

        const discount = coupon.discount_type === 'percentage'
            ? (orderAmount * coupon.discount_value) / 100
            : Math.min(coupon.discount_value, orderAmount);

        return { coupon, discount: Number(discount.toFixed(2)) };
    }

    static async getAll() {
        return CouponModel.findAll();
    }

    static async create(data) {
        return CouponModel.create(data);
    }

    static async toggleActive(id, is_active) {
        return CouponModel.toggleActive(id, is_active);
    }

    static async remove(id) {
        return CouponModel.delete(id);
    }
}

module.exports = CouponService;
