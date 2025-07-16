import { useEffect, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Context } from '../../App';

const orderServiceURL = import.meta.env.VITE_BACKEND_URL;

async function updateOrderStatus(originalOrderId) {
  try {
    const response = await fetch(`${orderServiceURL}/api/orders/${originalOrderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Đang giao hàng",
        isTemporary: false,
        paymentStatus: "Paid",
        paymentMethod: "Momo",
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    console.log("[PaymentSuccess] Order updated successfully.");
  } catch (error) {
    console.error("[PaymentSuccess] Failed to update order status:", error);
  }
}

function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [_, setCartCounter] = useContext(Context);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const resultCode = params.get("resultCode");
    const orderId = params.get("orderId");

    console.log("[PaymentSuccess] Processing payment result:", { resultCode, orderId });

    if (resultCode === "0") {
      toast.success("Thanh toán MoMo thành công!");

      if (orderId) {
        updateOrderStatus(orderId);
      }
    } else {
      toast.error("Thanh toán thất bại hoặc bị huỷ!");
    }

    setTimeout(() => navigate("/"), 4000);
  }, [params, navigate, setCartCounter]);

  return (
    <div className="min-h-screen flex justify-center items-center text-xl font-bold text-green-600">
      Đang xử lý kết quả thanh toán...
    </div>
  );
}

export default PaymentSuccess;
