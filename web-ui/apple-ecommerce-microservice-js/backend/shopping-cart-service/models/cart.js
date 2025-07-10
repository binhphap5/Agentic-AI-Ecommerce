const mongoose = require("mongoose")

const cartItemSchema = new mongoose.Schema({
    product: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    color: {
        type: String,
        required: false
    },
    storage: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: true
    }
});


const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Tính toán tổng tiền và tổng số lượng trước khi lưu
cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    next();
});

module.exports = mongoose.model('Cart', cartSchema);