import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaMoneyBillWave, FaUniversity } from "react-icons/fa";
import { Context } from "../../App";

function CheckOut() {
  const [_, setCartCounter] = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();
  const { user: userData, cart: cartData, orderId, expiresAt } = location.state || {};

  const [cartItems, setCartItems] = useState([]);
  const [remainingTime, setRemainingTime] = useState(300);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", paymentMethod: "COD",
  });

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
      setRemainingTime(diff);
      if (diff <= 0) {
        clearInterval(interval);
        toast.warning("Đơn hàng đã hết hạn. Quay về giỏ hàng...");
        setTimeout(() => navigate("/cart"), 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
        paymentMethod: "COD",
      });
    }
    if (cartData) {
      setCartItems(Object.values(cartData));
    }
  }, [userData, cartData]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const clearOrderedItemsFromCart = async () => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || {};
    const orderedProductIds = cartItems.map(item => item.product?._id || item.productId);
    const updatedCart = Object.fromEntries(
      Object.entries(storedCart).filter(([key, item]) => {
        const pid = item.product?._id || item.productId || key;
        return !orderedProductIds.includes(pid);
      })
    );
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartCounter(Object.values(updatedCart).length);

    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${userData._id}/bulk-remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: orderedProductIds }),
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (remainingTime <= 0) return toast.error("Đơn hàng đã hết hạn!");
    if (!formData.address.trim()) return toast.warning("Vui lòng nhập địa chỉ giao hàng!");
    
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTemporary: false,
          paymentStatus: formData.paymentMethod === "COD" ? "Unpaid" : "Paid",
          paymentMethod: formData.paymentMethod,
          status: "Confirmed",
          address: formData.address,
        }),
      });

      if (!res.ok) throw new Error("Xác nhận đơn hàng thất bại");
      const updatedOrder = await res.json();

      if (formData.paymentMethod === "Momo") {
        // 🧠 Lưu tạm thông tin để xử lý khi redirect quay lại
        sessionStorage.setItem("orderId", updatedOrder._id);
        sessionStorage.setItem("userId", userData._id);
        sessionStorage.setItem("cartItems", JSON.stringify(cartItems));

        const momoRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/${updatedOrder._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            amount: calculateTotal(),
            userId: userData._id, 
          }),
        });


        const momoData = await momoRes.json();
        if (!momoData.success) throw new Error("Không lấy được MoMo payUrl");
        
        return window.location.href = momoData.payUrl;
      }

      await clearOrderedItemsFromCart();
      toast.success("Đặt hàng thành công!");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Lỗi khi xác nhận đơn hàng!");
    }
  };

  const paymentOptions = [
    { id: "COD", label: "Thanh toán khi nhận hàng", icon: <FaMoneyBillWave className="text-green-500" size={20} /> },
    {
      id: "Momo", label: "Ví điện tử Momo",
      icon: <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" alt="Momo" className="w-6 h-6 object-contain" />,
    },
    { id: "Bank", label: "Chuyển khoản ngân hàng", icon: <FaUniversity className="text-blue-600" size={20} /> },
  ];

  const formatCountdown = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Thông tin thanh toán</h2>
        {expiresAt && (
          <div className="bg-red-100 text-red-600 font-semibold px-4 py-2 rounded shadow">
            Hết hạn sau: {formatCountdown(remainingTime)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitOrder} className="grid md:grid-cols-2 gap-6">
        {/* Left */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h3 className="text-xl font-semibold mb-4">Thông tin khách hàng</h3>
          {["name", "email", "phone", "address"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {field === "name" ? "Họ tên" : field === "phone" ? "Số điện thoại" : field === "address" ? "Địa chỉ" : "Email"}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleFormChange}
                disabled={["name", "email", "phone"].includes(field)}
                required
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          ))}

          <h3 className="text-xl font-semibold mt-6 mb-4">Phương thức thanh toán</h3>
          <div className="space-y-3">
            {paymentOptions.map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition ${
                  formData.paymentMethod === option.id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-300"
                    : "hover:border-blue-400"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={formData.paymentMethod === option.id}
                  onChange={handleFormChange}
                  className="accent-blue-600"
                />
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className={`w-full mt-6 py-3 rounded font-semibold text-white ${
              remainingTime <= 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={remainingTime <= 0}
          >
            Đặt hàng
          </button>
        </div>

        {/* Right */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Đơn hàng của bạn</h3>
          {cartItems.map((item, i) => (
            <div key={i} className="flex items-center mb-4">
              <img src={item.product?.images || item.image} alt={item.name} className="w-16 h-16 object-cover rounded mr-4" />
              <div className="flex-1">
                <p className="font-medium">{item.product?.name || item.name}</p>
                <p className="text-sm text-gray-500">x{item.quantity}</p>
                {item.storage && <p className="text-sm text-gray-500">Dung lượng: {item.storage}</p>}
                {item.color && <p className="text-sm text-gray-500">Màu: {item.color}</p>}
              </div>
              <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <hr className="my-4" />
          <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng</span>
            <span>{formatPrice(calculateTotal())}</span>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckOut;
