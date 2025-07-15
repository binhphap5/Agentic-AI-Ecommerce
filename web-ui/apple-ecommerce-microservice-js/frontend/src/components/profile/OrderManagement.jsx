import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaRegTimesCircle,
  FaHourglassHalf,
  FaUndoAlt,
  FaShippingFast,
  FaCreditCard,
} from "react-icons/fa";

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
            storage: product.storage,
            color: product.color,
          };
        })
      );

      setSelectedOrder({ ...order, items: enrichedItems });
      setStep(2);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết sản phẩm:", error);
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "COD":
        return "Tiền mặt";
      case "Momo":
        return "Ví MoMo";
      case "Bank":
        return "Chuyển khoản ngân hàng";
      default:
        return method;
    }
  };

  const renderPaymentStatusWithIcon = (status) => {
    switch (status) {
      case "Paid":
        return (
          <span className="flex items-center gap-2 text-green-600">
            <FaCheckCircle /> Đã thanh toán
          </span>
        );
      case "Unpaid":
        return (
          <span className="flex items-center gap-2 text-red-500">
            <FaRegTimesCircle /> Chưa thanh toán
          </span>
        );
      case "Pending":
        return (
          <span className="flex items-center gap-2 text-yellow-500">
            <FaHourglassHalf /> Đang xử lý
          </span>
        );
      case "Refunded":
        return (
          <span className="flex items-center gap-2 text-blue-500">
            <FaUndoAlt /> Đã hoàn tiền
          </span>
        );
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };


  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const {
      createdAt,
      paymentMethod,
      paymentStatus,
      shippingMethod,
      totalAmount,
      status,
      items,
      _id,
    } = selectedOrder;

    return (
      <div className="flex-grow lg:ml-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Chi tiết đơn hàng</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <p><strong>Mã đơn:</strong> {_id}</p>
            <p><strong>Ngày đặt:</strong> {new Date(createdAt).toLocaleString()}</p>
            <p className="flex items-center gap-2">
              <FaCreditCard className="text-green-600" />
              <strong>Phương thức thanh toán:</strong> {getPaymentMethodLabel(paymentMethod)}
            </p>
            <p className="flex items-center gap-2">
              <FaShippingFast className="text-blue-500" />
              <strong>Trạng thái thanh toán:</strong> {renderPaymentStatusWithIcon(paymentStatus)}
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
                <p className="text-sm text-gray-500">Dung lượng: {item.storage }</p>
                <p className="text-sm text-gray-500">Màu: {item.color }</p>

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
    <div className="bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-orange-400 mb-6">Đơn hàng của bạn</h2>
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order, index) => (
            <div
              key={index}
              onClick={() => handleOrderClick(order)}
              className="border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer bg-gray-50 hover:bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-500">
                  Ngày đặt: <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700">
                  {order.status}
                </span>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <FaCreditCard className="text-green-600" />
                  <span className="text-sm font-medium"> {getPaymentMethodLabel(order.paymentMethod)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {renderPaymentStatusWithIcon(order.paymentStatus)}
                </div>


                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-blue-600" />
                  <span className="text-sm font-medium">Tổng tiền: {order.totalAmount.toLocaleString()} VND</span>
                </div>

                {order.items?.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Sản phẩm:{" "}
                    <span className="font-medium">{order.items[0]?.name || "Xem chi tiết..."}</span>
                    {order.items.length > 1 && (
                      <span className="text-xs ml-1 text-gray-500">+{order.items.length - 1} sản phẩm khác</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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