const express = require("express")
const Cart = require("../models/cart")
const axios = require("axios")

const router = express.Router()

const PRODUCT_SERVICE_URI = process.env.PRODUCT_SERVICE_URI || "http://product-service:5001"

// add item to cart
router.post("/:userId/add", async (req, res) => {
  const { userId } = req.params;
  const { productId, quantity, color, storage } = req.body;

  if  (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Thiếu thông tin sản phẩm hoặc số lượng không hợp lệ" });
  }

  try {
    const productResponse = await axios.get(`${PRODUCT_SERVICE_URI}/api/products/${productId}`);
    if (!productResponse.data) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    const product = productResponse.data;
    const price = product.price;

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({
        userId: userId,
        items: [{ 
            product: productId, 
            quantity, 
            color: color || product.color, 
            storage: storage || product.storage, 
            price
        }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && 
                  item.color === (color || product.color) && 
                  item.storage === (storage || product.storage)
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ 
          product: productId, 
          quantity, 
          color: color || product.color,
          storage: storage || product.storage,
          price 
        });
      }
    }

    await cart.save();
    res.status(201).json({
      message: "Thêm vào giỏ hàng thành công",
      cart: cart,
    });
  } catch (e) {
      console.error("Cart add error:", e);
        res.status(500).json({ 
            message: "Lỗi server khi thêm vào giỏ hàng",
            error: e.message 
      });
  }
});


// get user cart
router.get("/:userId", async(req, res) => {
    const {userId} = req.params
    try{
        const cart = await Cart.findOne({userId})
        if (!cart) {
          return res.json({ userId, items: [] });
        }
        res.json(cart)
    }catch(e){
        res.status(500).send("Server Error")
    }
})

//remove item from cart
router.delete("/:userId/remove/:productId", async(req, res) => {
    const {userId, productId} = req.params

    try{
        const cart = await Cart.findOne({userId})
        if(!cart) return res.status(404).json({msg: "Cart not found"})

        cart.items = cart.items.filter((item) => item.product !== productId)

        await cart.save()
        res.json(cart)
    }catch(e){
        res.status(500).send("Server error")
    }
})

//remove multiple item from cart
router.post("/:userId/bulk-remove", async (req, res) => {
  const { userId } = req.params;
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Danh sách productIds không hợp lệ" });
  }

  try {
      const cart = await Cart.findOne({ userId });

      if (!cart) {
          return res.status(404).json({ message: "Không tìm thấy giỏ hàng của người dùng" });
      }

      cart.items = cart.items.filter(item => !productIds.includes(item.product));

      cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

      await cart.save();

      res.status(200).json({ message: "Xóa sản phẩm thành công", cart });
  } catch (error) {
      console.error("Lỗi khi xóa nhiều sản phẩm:", error);
      res.status(500).json({ message: "Lỗi server khi xóa nhiều sản phẩm" });
  }
});


//update item quantity
router.put("/:userId/update/:productId", async (req, res) => {
  const { userId, productId } = req.params;
  const { quantity, size } = req.body;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ msg: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ msg: "Product not found in cart" });
    }

    if (quantity !== undefined) cart.items[itemIndex].quantity = quantity;
    if (size !== undefined) cart.items[itemIndex].size = size;

    await cart.save();
    res.json(cart);
  } catch (e) {
    res.status(500).send("Server error");
  }
});


module.exports = router