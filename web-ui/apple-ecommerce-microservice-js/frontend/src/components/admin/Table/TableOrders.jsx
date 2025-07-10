import React, { useState, useEffect } from "react";
import Card from "../card/index";
import { parseISO, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function TableOrders({ orderData }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [step, setStep] = useState(1);
  const [filteredOrders, setFilteredOrders] = useState(orderData); // State to store filtered orders
  const [dateFilter, setDateFilter] = useState("all"); // Default filter is "all"

  // Handle row click to view order details
  const handleRowClick = (order) => {
    setSelectedOrder(order);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedOrder(null);
  };

  const handleConfirmOrder = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: 'confirmed',
          cartItems: selectedOrder.cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Xác nhận thành công!", {
          position: "top-right",
          autoClose: 2000,
        });

        // Navigate after success
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        setStep(1);
        setSelectedOrder(null);
      } else {
        alert("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Không thể xác nhận đơn hàng. Vui lòng thử lại.");
    }
  };

  // Handle Date Filter Change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
  };

  // Filter orders based on the selected date filter
  useEffect(() => {
    let filtered = [...orderData];

    const now = new Date();

    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(order => isToday(parseISO(order.createdAt)));
        break;
      case "yesterday":
        filtered = filtered.filter(order => isYesterday(parseISO(order.createdAt)));
        break;
      case "thisWeek":
        filtered = filtered.filter(order =>
          isWithinInterval(parseISO(order.createdAt), {
            start: startOfWeek(now),
            end: endOfWeek(now),
          })
        );
        break;
      case "thisMonth":
        filtered = filtered.filter(order =>
          isWithinInterval(parseISO(order.createdAt), {
            start: startOfMonth(now),
            end: endOfMonth(now),
          })
        );
        break;
      case "all":
        // "Tất cả" - No filter applied, show all orders
        break;
      default:
        break;
    }

    setFilteredOrders(filtered); // Update filtered orders state
  }, [dateFilter, orderData]); // Re-filter whenever the filter changes

  return (
    <div className="mt-5">
      <Card extra={"w-full pb-10 p-4 h-full"}>
        {/* Date Filter Section */}
        <div className="mb-4">
          <button
            onClick={() => handleDateFilterChange("all")}
            className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
          >
            Tất cả
          </button>
          <button
            onClick={() => handleDateFilterChange("today")}
            className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
          >
            Hôm nay
          </button>
          <button
            onClick={() => handleDateFilterChange("yesterday")}
            className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
          >
            Hôm qua
          </button>
          <button
            onClick={() => handleDateFilterChange("thisWeek")}
            className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
          >
            Tuần này
          </button>
          <button
            onClick={() => handleDateFilterChange("thisMonth")}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Tháng này
          </button>
        </div>

        {/* Step 1: Show Order List */}
        {step === 1 && (
          <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Full Name</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Address</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Created At</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr
                    key={index}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRowClick(order)}
                  >
                    <td className="py-3 px-4 text-sm text-black">{order.user.fullName}</td>
                    <td className="py-3 px-4 text-sm text-black">{order.user.email}</td>
                    <td className="py-3 px-4 text-sm text-black">{order.user.address}</td>
                    <td className="py-3 px-4 text-sm text-black">{order.status}</td>
                    <td className="py-3 px-4 text-sm text-black">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-black">
                      {order.status === 'confirmed' && <strong>đã xác nhận</strong>}
                      {order.status === 'pending' && <strong>Đơn hàng chờ xác nhận</strong>}
                      {order.status === 'finish' && <strong>Đã giao</strong>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {/* Step 2: Show Full Order Details */}
        {step === 2 && selectedOrder && (
          <div className="mt-8 p-6 border rounded-lg bg-white shadow-lg">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              Trở về
            </button>

            <h2 className="text-xl font-bold text-black">Chi tiết đơn hàng</h2>

            {/* User Information Table */}
            <h3 className="mt-6 text-lg font-bold text-black">Thông tin khách hàng</h3>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Field</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Full Name</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.user.fullName}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Email</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.user.email}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Address</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.user.address}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Status</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.status}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Payment Method</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.paymentMethod}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Shipping Method</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.shippingMethod}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Shipping Cost</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.shippingCost}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-black">Total</td>
                  <td className="py-3 px-4 text-sm text-black">{selectedOrder.total}</td>
                </tr>
              </tbody>
            </table>

            {/* Cart Items Table */}
            <h3 className="mt-6 text-lg font-bold text-black">Cart Items</h3>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Product Name</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Quantity</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Price</th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-black">Size</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.cartItems.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 text-sm text-black">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-black">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-black">{item.price}</td>
                    <td className="py-3 px-4 text-sm text-black">{item.selectedSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Display Created At Date */}
            <p className="mt-4"><strong>Created At:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>

            {selectedOrder.status === 'pending' && (
              <div className="mt-6 flex justify-end">
                <a
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default link behavior
                    handleConfirmOrder(); // Call the confirm order function
                  }}
                  className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-800 transition duration-300 cursor-pointer"
                >
                  Xác nhận đơn hàng
                </a>
              </div>
            )}

          </div>
        )}
      </Card>
       

    </div>
  );
}

export default TableOrders;
