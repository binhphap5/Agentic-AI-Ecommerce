import React, { useEffect, useState } from "react";

const History = () => {
  const storedUser = localStorage.getItem('user');
  const user = JSON.parse(storedUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // State for selected order
  const [step, setStep] = useState(1); // Step 1: Order list, Step 2: Order details

  useEffect(() => {
    if (user.email) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/perfumes/getOrders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch orders");
          }
          return response.json();
        })
        .then(data => {
          const finishedOrders = data.filter(order => order.status === 'finish'); // Filter orders with status 'finish'
          setOrders(finishedOrders);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [user.email]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setStep(2); // Switch to Step 2 when an order is clicked
  };

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const { createdAt, paymentMethod, shippingMethod, total, status, cartItems } = selectedOrder;
    return (
      <div>
        <h3 className="text-xl font-semibold mb-4">Chi tiết đơn hàng</h3>
        <div className="mb-4">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Ngày tạo</th>
                <th className="border border-gray-300 px-4 py-2">Phương thức thanh toán</th>
                <th className="border border-gray-300 px-4 py-2">Tổng tiền</th>
                <th className="border border-gray-300 px-4 py-2">Trạng thái</th>
                <th className="border border-gray-300 px-4 py-2">Phương thức vận chuyển</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">{new Date(createdAt).toLocaleString()}</td>
                <td className="border border-gray-300 px-4 py-2">{paymentMethod}</td>
                <td className="border border-gray-300 px-4 py-2">{total.toLocaleString()} VND</td>
                <td className="border border-gray-300 px-4 py-2">{status}</td>
                <td className="border border-gray-300 px-4 py-2">{shippingMethod}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-lg font-semibold mb-2">Chi tiết sản phẩm</h4>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Ảnh</th>
              <th className="border border-gray-300 px-4 py-2">Tên</th>
              <th className="border border-gray-300 px-4 py-2">Số lượng</th>
              <th className="border border-gray-300 px-4 py-2">Giá</th>
              <th className="border border-gray-300 px-4 py-2">Kích thước</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="max-w-[150px] max-h-[150px] overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2">{item.price.toLocaleString()} VND</td>
                <td className="border border-gray-300 px-4 py-2">{item.selectedSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOrderList = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Lịch sử đơn hàng</h2>
      {orders.length > 0 ? (
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Ngày tạo</th>
              <th className="border border-gray-300 px-4 py-2">Phương thức thanh toán</th>
              <th className="border border-gray-300 px-4 py-2">Tổng tiền</th>
              <th className="border border-gray-300 px-4 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index} onClick={() => handleOrderClick(order)} className="cursor-pointer hover:bg-gray-200">
                <td className="border border-gray-300 px-4 py-2">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="border border-gray-300 px-4 py-2">{order.paymentMethod}</td>
                <td className="border border-gray-300 px-4 py-2">{order.total.toLocaleString()} VND</td>
                <td className="border border-gray-300 px-4 py-2">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Không có đơn hàng nào được tìm thấy.</p>
      )}
    </div>
  );

  const handleBackToOrders = () => {
    setStep(1); // Switch back to Step 1 when going back
    setSelectedOrder(null); // Clear the selected order
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div>
      {step === 1 && renderOrderList()} {/* Step 1: Display order list */}
      {step === 2 && (
        <div>
          <button
            onClick={handleBackToOrders}
            className="mb-4 text-sm text-blue-600 underline"
          >
            Quay lại danh sách đơn hàng
          </button>
          {renderOrderDetails()} {/* Step 2: Display order details */}
        </div>
      )}
    </div>
  );
};

export default History;
