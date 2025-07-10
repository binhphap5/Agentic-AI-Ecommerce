const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/payment");
const router = express.Router();

// Initiate ATM payment
router.post("/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { amount } = req.body;
    const requestId = Date.now().toString();
    const momoOrderId = `order_${requestId}`;

    // Construct raw signature string
    const rawSig =
        `accessKey=${process.env.MOMO_ACCESS_KEY}` +
        `&amount=${amount}` +
        `&extraData=` +
        `&ipnUrl=${process.env.IPN_URL}` +
        `&orderId=${momoOrderId}` +
        `&orderInfo=Thanh toán ${orderId}` +
        `&partnerCode=${process.env.MOMO_PARTNER_CODE}` +
        `&redirectUrl=${process.env.REDIRECT_URL}` +
        `&requestId=${requestId}` +
        `&requestType=payWithMethod`;

    const signature = crypto
        .createHmac("sha256", process.env.MOMO_SECRET_KEY)
        .update(rawSig)
        .digest("hex");

    // Request body for ATM payment
    const body = {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        requestId,
        amount: amount.toString(),
        orderId: momoOrderId,
        orderInfo: `Thanh toán ${orderId}`,
        redirectUrl: process.env.REDIRECT_URL,
        ipnUrl: process.env.IPN_URL,
        extraData: "",
        requestType: "payWithMethod",
        signature,
        lang: "vi",
        method: {
            methodType: "atm"
        }
    };

    try {
        const resp = await axios.post(process.env.MOMO_ENDPOINT, body, {
            headers: { "Content-Type": "application/json" }
        });
        console.log("MoMo API Response:", JSON.stringify(resp.data, null, 2));
        if (resp.data && resp.data.payUrl) {
            const payment = new Payment({
                orderId,
                momoOrderId,
                requestId,
                amount,
                status: "pending",
                paymentMethod: "atm"
            });
            await payment.save();
            return res.json({
                success: true,
                payUrl: resp.data.payUrl,
                paymentId: payment._id
            });
        }
        throw new Error(resp.data.message || "No payUrl returned");
    } catch (err) {
        console.error("MoMo API Error:", err.response?.data || err.message);
        return res.status(500).json({
            success: false,
            error: err.response?.data?.message || err.message
        });
    }
});

// Handle MoMo callback
router.post("/callback", async (req, res) => {
    const cb = req.body;
    const { orderId, requestId, resultCode, message } = cb;
    console.log("MoMo Callback:", JSON.stringify(cb, null, 2));

    // Verify signature
    const rawSig =
        `accessKey=${process.env.MOMO_ACCESS_KEY}` +
        `&amount=${amount}&` +
        `&extraData=${cb.extraData}` +
        `&message=${cb.message}` +
        `&orderId=${orderId}` +
        `&orderInfo=${cb.orderInfo}` +
        `&orderType=${cb.orderType}&` +
        `&partnerCode=${process.env.MOMO_PARTNER_CODE}` +
        `&payType=${cb.payType}` +
        `&requestId=${cb.requestId}&` +
        `&responseTime=${cb.responseTime}` +
        `&resultCode=${cb.resultCode}` +
        `&transId=${cb.transId}`;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.MOMO_SECRET_KEY)
        .update(rawSig)
        .digest("hex");
    if (cb.signature !== expectedSignature) {
        console.error("Invalid callback signature");
        return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    try {
        const payment = await Payment.findOne({ momoOrderId: orderId, requestId });
        if (!payment) {
            console.error("Payment not found:", { orderId, requestId });
            return res.status(404).json({ success: false, error: "Payment not found" });
        }
        payment.status = resultCode === 0 ? "success" : "failed";
        payment.extraCallback = cb;
        await payment.save();
        return res.json({
            success: true,
            resultCode,
            message,
            orderId,
            requestId
        });
    } catch (err) {
        console.error("Callback Error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
        }
    }
    );

    // Check payment status
    router.get("/:paymentId", async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }
        return res.json({
            success: true,
            payment: {
                orderId: payment.orderId,
                momoOrderId: payment.momoOrderId,
                requestId: payment.requestId,
                amount: payment.amount,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                extraCallback: payment.extraCallback
            },
        });
    } catch (err) {
        console.error("Status Check Error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});

// Mock success callback for testing
router.post("/mock-success/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { requestId, amount } = req.body;
    const transId = `trans_${Date.now()}`;
    const responseTime = Date.now().toString();

    // Construct mock callback data
    const cb = {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        orderId: `order_${requestId}`,
        requestId,
        amount: amount.toString(),
        orderInfo: `Thanh toán ${orderId}`,
        orderType: "momo_wallet",
        transId,
        resultCode: 0,
        message: "Thành công",
        payType: "atm",
        responseTime,
        extraData: ""
    };

    // Generate signature for mock callback
    const rawSig =
        `accessKey=${process.env.MOMO_ACCESS_KEY}` +
        `&amount=${cb.amount}` +
        `&extraData=${cb.extraData}` +
        `&message=${cb.message}` +
        `&orderId=${cb.orderId}` +
        `&orderInfo=${cb.orderInfo}` +
        `&orderType=${cb.orderType}` +
        `&partnerCode=${process.env.MOMO_PARTNER_CODE}` +
        `&payType=${cb.payType}` +
        `&requestId=${cb.requestId}` +
        `&responseTime=${cb.responseTime}` +
        `&resultCode=${cb.resultCode}` +
        `&transId=${cb.transId}`;
    cb.signature = crypto
        .createHmac("sha256", process.env.MOMO_SECRET_KEY)
        .update(rawSig)
        .digest("hex");

    try {
        const payment = await Payment.findOne({ momoOrderId: cb.orderId, requestId });
        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }
        payment.status = "success";
        payment.extraCallback = cb;
        await payment.save();
        return res.json({
            success: true,
            resultCode: 0,
            message: "Thành công",
            orderId: cb.orderId,
            requestId: cb.requestId,
            transId: cb.transId
        });
    } catch (err) {
        console.error("Mock Success Error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});

module.exports = router;