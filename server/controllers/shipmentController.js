const ShipmentService = require('../services/shipmentService');
const OrderModel      = require('../models/orderModel');
const { getIO }       = require('../config/socket');

class ShipmentController {

    static async create(req, res) {
        try {
            const id = await ShipmentService.createShipment(req.body);

            // Notify user in real-time
            try {
                const order = await OrderModel.findById(req.body.order_id);
                const io = getIO();
                io.to(`user_${order.user_id}`).emit('order_update', {
                    orderId:      order.id,
                    order_status: 'shipped'
                });
            } catch (_) {}

            res.json({ success: true, id });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getByOrder(req, res) {
        try {
            const shipment = await ShipmentService.getByOrder(req.params.orderId);
            res.json(shipment || {});
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAll(req, res) {
        try {
            const shipments = await ShipmentService.getAll();
            res.json(shipments);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            await ShipmentService.updateShipment(req.params.orderId, req.body);

            // If delivered, notify user
            if (req.body.status === 'delivered') {
                try {
                    const order = await OrderModel.findById(req.params.orderId);
                    const io = getIO();
                    io.to(`user_${order.user_id}`).emit('order_update', {
                        orderId:      order.id,
                        order_status: 'delivered'
                    });
                } catch (_) {}
            }

            res.json({ success: true });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = ShipmentController;
