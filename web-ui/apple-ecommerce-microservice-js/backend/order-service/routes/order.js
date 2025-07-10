const express = require("express");
const Order = require("../models/order");
const router = express.Router();

// Tạo đơn hàng tạm thời
router.post("/:userId", async (req, res) => {
    const { userId } = req.params;
    const { items, totalAmount } = req.body;

    try {
        const order = new Order({
            userId,
            items,
            totalAmount,
            isTemporary: true,
            paymentStatus: "Unpaid",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
        await order.save();
        res.status(201).json(order);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

// Lấy tất cả đơn của user
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const orders = await Order.find({ userId });
        res.json(orders);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

// Lấy đơn hàng cụ thể
router.get("/:userId/:orderId", async (req, res) => {
    const { userId, orderId } = req.params;
    try {
        const order = await Order.findOne({ userId, _id: orderId });
        if (!order) return res.status(404).json({ msg: "Order not found" });
        res.json(order);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

// Cập nhật trạng thái đơn
router.put("/:orderId/status", async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus, isTemporary } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (typeof isTemporary !== "undefined") order.isTemporary = isTemporary;

        if (isTemporary === false && order.expiresAt) {
            order.expiresAt = undefined; // hoặc: delete order.expiresAt;
        }

        await order.save();
        res.json(order);
    } catch (e) {
        res.status(500).json({ msg: e.message });
    }
});

module.exports = router;
