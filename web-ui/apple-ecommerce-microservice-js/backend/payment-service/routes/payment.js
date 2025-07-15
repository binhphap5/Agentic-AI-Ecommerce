const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/payment");
const router = express.Router();
require("dotenv").config();

const orderServiceURL = process.env.ORDER_SERVICE_URL;


// Initiate ATM payment
router.post("/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { amount, userId } = req.body;
    const requestId = Date.now().toString();
    const momoOrderId = `order_${requestId}`;

    const rawSig =
        `accessKey=${process.env.MOMO_ACCESS_KEY}` +
        `&amount=${amount}` +
        `&extraData=${orderId}_${userId}` + 
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

    const body = {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        requestId,
        amount: amount.toString(),
        orderId: momoOrderId,
        orderInfo: `Thanh toán ${orderId}`,
        redirectUrl: process.env.REDIRECT_URL,
        ipnUrl: process.env.IPN_URL,
        extraData: `${orderId}_${userId}`,
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

        if (resp.data?.payUrl) {
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
        return res.status(500).json({
            success: false,
            error: err.response?.data?.message || err.message
        });
    }
});

router.post("/callback", async (req, res) => {
    const cb = req.body;
    const {
        orderId: momoOrderId,
        requestId,
        resultCode,
        message,
        signature,
        amount
    } = cb;

    // Tạo lại chữ ký để kiểm tra hợp lệ
    const rawSig =
        `accessKey=${process.env.MOMO_ACCESS_KEY}` +
        `&amount=${amount}` +
        `&extraData=${cb.extraData}` +
        `&message=${message}` +
        `&orderId=${momoOrderId}` +
        `&orderInfo=${cb.orderInfo}` +
        `&orderType=${cb.orderType}` +
        `&partnerCode=${process.env.MOMO_PARTNER_CODE}` +
        `&payType=${cb.payType}` +
        `&requestId=${requestId}` +
        `&responseTime=${cb.responseTime}` +
        `&resultCode=${resultCode}` +
        `&transId=${cb.transId}`;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.MOMO_SECRET_KEY)
        .update(rawSig)
        .digest("hex");

    if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, error: "Chữ ký không hợp lệ" });
    }

    try {
        // Tìm thanh toán liên quan
        const payment = await Payment.findOne({ momoOrderId, requestId });
        if (!payment) {
            return res.status(404).json({ success: false, error: "Không tìm thấy thanh toán" });
        }

        payment.status = resultCode === 0 ? "success" : "failed";
        payment.extraCallback = cb;
        await payment.save();

        // Tách orderId và userId từ extraData
        console.log(`[MoMo Callback] extraData:`, cb.extraData);
        const extraParts = cb.extraData?.split("_") || [];
        const originalOrderId = extraParts[0];
        const userId = extraParts[1];
        console.log(`[MoMo Callback] Extracted - orderId: ${originalOrderId}, userId: ${userId}`);

        if (!originalOrderId || !userId) {
            console.error(`[MoMo Callback] Missing orderId or userId in extraData`);
            return res.status(400).json({ success: false, error: "Thiếu orderId hoặc userId trong extraData" });
        }

        // Nếu thanh toán thành công → cập nhật đơn hàng
        if (resultCode === 0) {
            // Cập nhật trạng thái đơn hàng
            const orderRes = await fetch(`${orderServiceURL}/api/orders/${originalOrderId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "Confirmed",
                    isTemporary: false,
                    paymentStatus: "Paid Momo",
                    paymentMethod: "Momo"
                }),
            });

            if (!orderRes.ok) {
                console.warn("[MoMo Callback] Không cập nhật được đơn hàng");
            } else {
                console.log("[MoMo Callback] Order status updated successfully");
            }

            // Bỏ phần xóa cart - để frontend PaymentSuccess xử lý
            console.log("[MoMo Callback] Cart removal will be handled by frontend");
        }

        return res.status(200).json({
            success: true,
            resultCode,
            message,
            momoOrderId,
            requestId
        });

    } catch (err) {
        console.error("MoMo callback error:", err);
        return res.status(500).json({ success: false, error: "Lỗi server khi xử lý callback" });
    }
});

// Check payment status
router.get("/:paymentId", async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }
        return res.json({ success: true, payment });
    } catch (err) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});

module.exports = router;
