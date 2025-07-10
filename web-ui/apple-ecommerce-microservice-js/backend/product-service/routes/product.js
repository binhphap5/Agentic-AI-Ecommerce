const express = require("express");
const Product = require("../models/product");
const router = express.Router();

// CREATE single product
router.post("/create", async (req, res) => {
  const {
    product_id,
    type,
    name,
    ram,
    storage,
    price,
    description,
    evaluate,
    color,
    image
  } = req.body;

  try {
    const newProduct = new Product({
      product_id,
      type,
      name,
      ram,
      storage,
      price,
      description,
      evaluate,
      color,
      image
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (e) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});

// BULK create
router.post("/bulk-create", async (req, res) => {
  const products = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ msg: "Product array is required" });
  }

  try {
    const created = await Product.insertMany(products);
    res.status(201).json({
      msg: `${created.length} products created`,
      products: created
    });
  } catch (e) {
    res.status(500).json({ msg: "Failed to create products", error: e.message });
  }
});

// GET all products (distinct by name)
router.get("/get", async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $group: {
          _id: "$name",        // nhóm theo name
          product: { $first: "$$ROOT" } // lấy sản phẩm đầu tiên cho mỗi name
        }
      },
      {
        $replaceRoot: { newRoot: "$product" } // thay thế root = document vừa lấy
      }
    ]);

    res.json(products);
  } catch (e) {
    res.status(500).json({ msg: "Server error", error: e.message });
  }
});

// GET product by Mongo _id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE product
router.put("/update/:id", async (req, res) => {
  const {
    product_id,
    type,
    name,
    ram,
    storage,
    price,
    description,
    evaluate,
    color,
    image,
    comments  
  } = req.body;

  try {
    const updateData = {
      product_id,
      type,
      name,
      ram,
      storage,
      price,
      description,
      evaluate,
      color,
      image
    };

    // Nếu có comments trong request thì cập nhật
    if (comments) {
      updateData.comments = comments;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Product not found" });
    
    // Tính toán lại rating sau khi update
    updated.calculateAverageRating();
    await updated.save();
    
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "Server Error", error: e.message });
  }
});

// THÊM COMMENT 
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, comment, star, imageUrl } = req.body;

    // Validate input
    if (!email || !comment || !star) {
      return res.status(400).json({ 
        message: "Email, comment và star rating là bắt buộc." 
      });
    }

    // Đảm bảo star là số
    const starRating = Number(star);
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      return res.status(400).json({ 
        message: "Star rating phải là số từ 1 đến 5." 
      });
    }

    // Tìm product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    // Tạo comment mới (bỏ phần kiểm tra duplicate comment)
    const newComment = {
      email,
      comment: comment.trim(),
      star: starRating,
      imageUrl: imageUrl || "https://i.ibb.co/sthmNhK/avatar-4.png",
      createdAt: new Date()
    };

    // Thêm comment vào product
    if (!product.comments) {
      product.comments = [];
    }
    product.comments.push(newComment);

    // Lưu product (rating sẽ được tự động tính nhờ middleware)
    await product.save();

    res.status(201).json({
      message: "Thêm bình luận thành công!",
      product: product
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ 
      message: "Lỗi server khi thêm bình luận.", 
      error: error.message 
    });
  }
});

// XÓA COMMENT 
router.delete("/:id/comments/:commentIndex", async (req, res) => {
  try {
    const { id, commentIndex } = req.params;
    const { userEmail } = req.body; // Email của user muốn xóa comment

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    if (!product.comments || product.comments.length === 0) {
      return res.status(404).json({ message: "Không có bình luận nào." });
    }

    const index = parseInt(commentIndex);
    if (index < 0 || index >= product.comments.length) {
      return res.status(400).json({ message: "Index bình luận không hợp lệ." });
    }

    // Kiểm tra quyền xóa (chỉ user tạo comment mới được xóa)
    if (product.comments[index].email !== userEmail) {
      return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này." });
    }

    // Xóa comment
    product.comments.splice(index, 1);
    
    // Lưu product (rating sẽ được tự động tính lại)
    await product.save();

    res.json({
      message: "Xóa bình luận thành công!",
      product: product
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ 
      message: "Lỗi server khi xóa bình luận.", 
      error: error.message 
    });
  }
});

// GET PRODUCT RATING (endpoint riêng để lấy rating)
router.get("/:id/rating", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    res.json({
      averageRating: product.averageRating,
      totalRatings: product.totalRatings,
      ratingsBreakdown: {
        5: product.comments?.filter(c => c.star === 5).length || 0,
        4: product.comments?.filter(c => c.star === 4).length || 0,
        3: product.comments?.filter(c => c.star === 3).length || 0,
        2: product.comments?.filter(c => c.star === 2).length || 0,
        1: product.comments?.filter(c => c.star === 1).length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Lỗi server khi lấy rating.", 
      error: error.message 
    });
  }
});

// DELETE Product single
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Product not found" });
    res.json({ msg: "Product deleted" });
  } catch (e) {
    res.status(500).json({ msg: "Server Error", error: e.message });
  }
});

// DELETE multiple
router.delete("/bulk-delete", async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ msg: "Array of product IDs is required" });
  }

  try {
    const result = await Product.deleteMany({ _id: { $in: ids } });
    res.json({
      msg: `${result.deletedCount} products deleted`,
      deletedCount: result.deletedCount
    });
  } catch (e) {
    res.status(500).json({ msg: "Server Error", error: e.message });
  }
});

// GET màu sắc của sản phẩm theo tên
router.get("/by-name/:name", async (req, res) => {
  const productName = req.params.name;

  try {
    const variations = await Product.find({ name: productName });

    if (!variations || variations.length === 0) {
      return res.status(404).json({ msg: "Không tìm thấy sản phẩm nào với tên này." });
    }

    res.json(variations);
  } catch (e) {
    res.status(500).json({ msg: "Lỗi server", error: e.message });
  }
});

module.exports = router;