const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  star: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  imageUrl: {
    type: String,
    default: "https://i.ibb.co/sthmNhK/avatar-4.png"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  product_id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  ram: {
    type: String
  },
  storage: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  evaluate: {
    type: String, 
    default: ""    
  },
  color: {
    type: String
  },
  image: {
    type: String
  },
  comments: [commentSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Method để tính toán rating trung bình
productSchema.methods.calculateAverageRating = function() {
  if (!this.comments || this.comments.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const totalStars = this.comments.reduce((sum, comment) => sum + comment.star, 0);
  this.averageRating = Math.round((totalStars / this.comments.length) * 10) / 10; // Làm tròn 1 chữ số thập phân
  this.totalRatings = this.comments.length;
};

// Middleware để tự động tính rating khi save
productSchema.pre('save', function(next) {
  this.calculateAverageRating();
  next();
});

module.exports = mongoose.model("Product", productSchema);