import { useEffect, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Context } from '../../App';

function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [_, setCartCounter] = useContext(Context);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const resultCode = params.get("resultCode");
    const orderId = sessionStorage.getItem("orderId");
    const userId = sessionStorage.getItem("userId");
    
    console.log("[PaymentSuccess] Processing payment result:", { resultCode, orderId, userId });

    if (resultCode === "0") {
      toast.success("Thanh toán MoMo thành công!");
      
      // Xóa cart ở frontend vì backend callback có thể thất bại
      removeOrderedItemsFromCart(userId, orderId);
    } else {
      toast.error("Thanh toán thất bại hoặc bị huỷ!");
    }

    // Dọn dẹp sessionStorage
    sessionStorage.removeItem("orderId");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("cartItems");

    setTimeout(() => navigate("/"), 4000);
  }, [params, navigate, setCartCounter]);

  const removeOrderedItemsFromCart = async (userId, orderId) => {
    try {
      // 1. Lấy thông tin order để biết sản phẩm nào cần xóa
      const orderResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${userId}/${orderId}`);
      
      if (!orderResponse.ok) {
        throw new Error(`Failed to fetch order: ${orderResponse.status}`);
      }
      
      const orderData = await orderResponse.json();
      console.log("[PaymentSuccess] Order data:", orderData);
      
      // Lấy danh sách productId từ order
      const orderedProductIds = orderData?.items?.map(item => item.productId) || 
                               orderData?.products?.map(p => p.productId) || [];
      
      console.log("[PaymentSuccess] Ordered product IDs:", orderedProductIds);
      
      if (orderedProductIds.length === 0) {
        console.warn("[PaymentSuccess] No products found in order");
        return;
      }
      
      // 2. Xóa từ backend cart - sử dụng đúng format như CartTable
      const cartResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${userId}/bulk-remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds: orderedProductIds })
      });
      
      if (!cartResponse.ok) {
        console.error("[PaymentSuccess] Failed to remove from backend cart:", cartResponse.status);
        const errorText = await cartResponse.text();
        console.error("[PaymentSuccess] Backend error:", errorText);
        // Vẫn tiếp tục xóa localStorage
      } else {
        console.log("[PaymentSuccess] Successfully removed from backend cart");
      }
      
      // 3. Lấy cart hiện tại từ localStorage (dạng array như CartTable)
      const cartData = localStorage.getItem("cart");
      let currentCart = [];
      
      try {
        if (cartData && cartData !== "undefined") {
          currentCart = JSON.parse(cartData);
          // Đảm bảo là array
          if (!Array.isArray(currentCart)) {
            currentCart = [];
          }
        }
      } catch (e) {
        console.error("[PaymentSuccess] Error parsing cart:", e);
        currentCart = [];
      }
      
      console.log("[PaymentSuccess] Current localStorage cart:", currentCart);
      
      // Filter ra những sản phẩm không có trong order
      const updatedCart = currentCart.filter(item => {
        const productId = item.productId || item.product?._id;
        const shouldKeep = !orderedProductIds.includes(productId);
        console.log(`[PaymentSuccess] Product ${productId}: shouldKeep=${shouldKeep}`);
        return shouldKeep;
      });
      
      console.log("[PaymentSuccess] Updated cart:", updatedCart);
      
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      setCartCounter(updatedCart.length);
      
      console.log("[PaymentSuccess] Cart updated successfully");
      
    } catch (error) {
      console.error("[PaymentSuccess] Error removing items from cart:", error);
      // Fallback: clear toàn bộ cart
      localStorage.setItem("cart", JSON.stringify([]));
      setCartCounter(0);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center text-xl font-bold text-green-600">
      Đang xử lý kết quả thanh toán...
    </div>
  );
}

export default PaymentSuccess;