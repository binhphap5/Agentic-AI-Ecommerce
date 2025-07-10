import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaShippingFast, FaCreditCard } from "react-icons/fa";

const OrderManagement = () => {
  const storedUser = localStorage.getItem("user");
  const user = JSON.parse(storedUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (user._id) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${user._id}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch orders");
          return response.json();
        })
        .then((data) => {
          setOrders(data);
          console.log(data)
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [user._id]);

  const handleOrderClick = async (order) => {
    try {
      // Gọi API lấy thông tin chi tiết từng sản phẩm từ productId
      const enrichedItems = await Promise.all(
        order.items.map(async (item) => {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${item.productId}`);
          const product = await res.json();
          return {
            ...item,
            name: product.name,
            price: product.price,
            image: product.image,
            selectedSize: item.selectedSize || "-", // fallback nếu không có
          };
        })
      );

      setSelectedOrder({ ...order, items: enrichedItems });
      setStep(2);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    }
  };


  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const {
      createdAt,
      paymentMethod,
      shippingMethod,
      totalAmount,
      status,
      items,
      _id,
    } = selectedOrder;

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Chi tiết đơn hàng</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <p><strong>Mã đơn:</strong> {_id}</p>
            <p><strong>Ngày đặt:</strong> {new Date(createdAt).toLocaleString()}</p>
            <p className="flex items-center gap-2">
              <FaCreditCard className="text-green-600" />
              <strong>Phương thức thanh toán:</strong> {paymentMethod || "COD"}
            </p>
            <p className="flex items-center gap-2">
              <FaShippingFast className="text-blue-500" />
              <strong>Vận chuyển:</strong> {shippingMethod || "Giao hàng nhanh"}
            </p>
          </div>
          <div className="space-y-2">
            <p><strong>Tổng tiền:</strong> {totalAmount.toLocaleString()} VND</p>
            <p><strong>Trạng thái:</strong> <span className="text-yellow-600 font-semibold">{status}</span></p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-6 mb-3">Danh sách sản phẩm</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-4 border rounded p-3">
              <img
                src={item.image || item.productImage}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{item.name}</h4>
                <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                <p className="text-sm text-gray-500">Kích thước: {item.selectedSize || "-"}</p>
              </div>
              <div className="font-bold text-blue-700">
                {(item.price * item.quantity).toLocaleString()} VND
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOrderList = () => {
    const filteredOrders = orders.filter((order) => order.status !== "finish");

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Đơn hàng của bạn</h2>
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ngày đặt</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Thanh toán</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr
                    key={index}
                    onClick={() => handleOrderClick(order)}
                    className="cursor-pointer hover:bg-blue-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.paymentMethod || "COD"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.totalAmount.toLocaleString()} VND</td>
                    <td className="px-6 py-4 whitespace-nowrap text-yellow-600 font-semibold">
                      {order.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Không có đơn hàng nào đang chờ xử lý.</p>
        )}
      </div>
    );
  };

  const handleBackToOrders = () => {
    setStep(1);
    setSelectedOrder(null);
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {step === 1 && renderOrderList()}
      {step === 2 && (
        <div>
          <button
            onClick={handleBackToOrders}
            className="mb-4 text-sm text-blue-600 underline hover:text-blue-800"
          >
            ← Quay lại danh sách đơn hàng
          </button>
          {renderOrderDetails()}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;