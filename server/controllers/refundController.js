const RefundService = require('../services/refundService');

class RefundController {

    static async request(req, res) {
        try {
            const id = await RefundService.requestRefund(req.user.id, req.body);
            res.json({ success: true, id });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getUserRefunds(req, res) {
        try {
            const refunds = await RefundService.getUserRefunds(req.user.id);
            res.json(refunds);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAllRefunds(req, res) {
        try {
            const refunds = await RefundService.getAllRefunds();
            res.json(refunds);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async processRefund(req, res) {
        try {
            const { status, admin_notes, refund_method } = req.body;
            const result = await RefundService.processRefund(
                req.params.id, status, admin_notes, refund_method
            );
            res.json({ success: true, ...result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = RefundController;
