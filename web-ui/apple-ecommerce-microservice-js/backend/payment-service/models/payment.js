// models/payment.js
const mongoose = require("mongoose")

const PaymentSchema = new mongoose.Schema({
  orderId: String,
  momoOrderId: String,
  requestId: String,
  amount: Number,
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Payment", PaymentSchema)
