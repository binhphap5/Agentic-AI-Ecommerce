const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    items: [
        {
            productId: String,
            quantity: Number,
        },
    ],
    totalAmount: {
        type: Number,
        require: true,
    },
    status: {
        type: String,
        default: "Chờ xác nhận"
    },
    paymentStatus: { 
        type: String, 
        default: "Chưa thanh toán" 
    },
    paymentMethod: {
        type: String, 
        default: "COD"
    },
    isTemporary: {  // dùng để check xem nó là order tạm hay order final
        type: Boolean, 
        default: true 
    },
    address: {
        type: String,
    },
    expiresAt: { 
        type: Date,
        index: { expires: 0 }, // TTL index for auto deletion
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Order", orderSchema)


