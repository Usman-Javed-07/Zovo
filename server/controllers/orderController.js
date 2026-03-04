const OrderService   = require('../services/orderService');
const InvoiceService = require('../services/invoiceService');
const OrderModel     = require('../models/orderModel');
const StripeService  = require('../services/stripeService');
const { getIO }      = require('../config/socket');

class OrderController {

    static async placeOrder(req, res) {
        try {
            const userId  = req.user.id;
            const { orderId, final_amount } = await OrderService.placeOrder(userId, req.body);
            const order   = await OrderModel.findById(orderId);
            const items   = await OrderModel.getItems(orderId);

            // If Stripe payment, create checkout session and return URL
            if (req.body.payment_method === 'stripe') {
                const origin     = `${req.protocol}://${req.get('host')}`;
                const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/order-history.html?success=1`;
                const cancelUrl  = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/checkout.html?cancelled=1`;
                const url        = await StripeService.createCheckoutSession(order, items, successUrl, cancelUrl);
                return res.json({ success: true, orderId, stripeUrl: url });
            }

            res.json({ success: true, orderId, final_amount });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getUserOrders(req, res) {
        try {
            const orders = await OrderService.getUserOrders(req.user.id);
            res.json(orders);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getOrderDetail(req, res) {
        try {
            const isAdmin = req.user.role === 'admin';
            const order   = await OrderService.getOrderDetail(
                parseInt(req.params.id), req.user.id, isAdmin
            );
            res.json(order);
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    static async getAllOrders(req, res) {
        try {
            const orders = await OrderModel.findAll();
            res.json(orders);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateStatus(req, res) {
        try {
            const { order_status } = req.body;
            const order = await OrderService.updateOrderStatus(req.params.id, order_status);

            // Emit real-time update to the user's room
            try {
                const io = getIO();
                io.to(`user_${order.user_id}`).emit('order_update', {
                    orderId:      order.id,
                    order_status: order.order_status
                });
            } catch (_) {}

            res.json({ success: true, order });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async downloadInvoice(req, res) {
        try {
            const isAdmin = req.user.role === 'admin';
            const order   = await OrderService.getOrderDetail(
                parseInt(req.params.id), req.user.id, isAdmin
            );
            const items   = await OrderModel.getItems(order.id);
            const pdfBuf  = await InvoiceService.generateInvoice(order, items);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
            res.send(pdfBuf);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = OrderController;
