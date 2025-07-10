import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { Context } from "../../App.jsx";
import LoadingSpinner from "../common/LoadingSpinner";

function AddToCartButton({ product, quantity }) {
  const [isAdding, setIsAdding] = useState(false);
  const [cartCounter, setCartCounter] = useContext(Context);

  const handleAddToCart = async () => {
    if (!product) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      toast.warning("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
      setIsAdding(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
      return;
    }

    try {
      const currentCart = JSON.parse(localStorage.getItem("cart") || "{}");

      let existingKey = null;
      for (const [key, item] of Object.entries(currentCart)) {
        if (
          item._id === product._id &&
          item.color === product.color &&
          item.storage === product.storage
        ) {
          existingKey = key;
          break;
        }
      }

      if (existingKey) {
        currentCart[existingKey].quantity += quantity;
      } else {
        const newKey = product._id + "-" + (product.color || "") + "-" + (product.storage || "");
        currentCart[newKey] = {
          ...product,
          quantity,
          color: product.color,
          storage: product.storage
        };
      }

      localStorage.setItem("cart", JSON.stringify(currentCart));
      setCartCounter(Object.keys(currentCart).length); // ✅ Update số lượng giỏ hàng

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${user._id}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          quantity,
          color: product.color,
          storage: product.storage
        })
      });

      window.dispatchEvent(new CustomEvent("cartUpdated")); // dùng cho Header lắng nghe nếu cần
      toast.success("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Có lỗi xảy ra khi thêm sản phẩm!");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user._id) {
      await handleAddToCart();
      setIsAdding(true);
      setTimeout(() => {
        window.location.href = "/cart";
      }, 2200);
    } else {
      toast.info("Vui lòng nhập thông tin trước khi thanh toán.");
      setIsAdding(true);
      setTimeout(() => {
        window.location.href = "/checkout/guest";
      }, 2200);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {isAdding && <LoadingSpinner />}
      <button
        onClick={handleAddToCart}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
      >
        Thêm vào giỏ hàng
      </button>

      <button
        onClick={handleBuyNow}
        className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-lg"
      >
        Mua ngay
      </button>
    </div>
  );
}

export default AddToCartButton;
