const ShipmentModel = require('../models/shipmentModel');
const OrderModel    = require('../models/orderModel');

class ShipmentService {

    /**
     * Admin creates a shipment record + updates order to "shipped"
     */
    static async createShipment(data) {
        const { order_id, courier_name, tracking_number, estimated_delivery, notes } = data;

        const order = await OrderModel.findById(order_id);
        if (!order) throw new Error('Order not found');

        const existing = await ShipmentModel.findByOrder(order_id);
        if (existing) throw new Error('Shipment already exists for this order');

        const id = await ShipmentModel.create({ order_id, courier_name, tracking_number, estimated_delivery, notes });
        await OrderModel.updateStatus(order_id, 'shipped');
        return id;
    }

    static async getByOrder(orderId) {
        return ShipmentModel.findByOrder(orderId);
    }

    static async getAll() {
        return ShipmentModel.findAll();
    }

    static async updateShipment(orderId, data) {
        await ShipmentModel.update(orderId, data);
        if (data.status === 'delivered') {
            await OrderModel.updateStatus(orderId, 'delivered');
        }
    }
}

module.exports = ShipmentService;
