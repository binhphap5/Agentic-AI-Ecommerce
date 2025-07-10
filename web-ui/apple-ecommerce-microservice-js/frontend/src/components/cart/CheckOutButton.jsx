import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function CheckOutButton({ cartItems , selectedItems }) {
    const navigate = useNavigate();

    const handleCheckOut = async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
            toast.error("Không tìm thấy thông tin người dùng!");
            return;
        }

        if (!selectedItems || selectedItems.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
            return;
        }

        // Lọc ra các sản phẩm được chọn
        const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));

        if (selectedCartItems.length === 0) {
            toast.error("Không thể xác định sản phẩm được chọn để thanh toán!");
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${user._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: selectedCartItems.map(item => ({
                        productId: item.productId || item.product?._id,
                        quantity: item.quantity,
                    })),
                    totalAmount: selectedCartItems.reduce((total, item) => total + item.price * item.quantity, 0),
                }),
            });

            if (!res.ok) throw new Error("Tạo đơn hàng tạm thời thất bại!");

            const createdOrder = await res.json();

            navigate("/checkout", {
                state: {
                    user,
                    cart: selectedCartItems,
                    orderId: createdOrder._id,
                    expiresAt: createdOrder.expiresAt,
                },
            });

        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo đơn hàng tạm thời!");
        }
    };


    return (
        <button
            type="button"
            className={`washed-gray-bg hover:bg-gray-700 text-white font-bold py-2 px-4 mb-8 w-48 mt-8 ${
                (!selectedItems || selectedItems.length === 0) ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleCheckOut}
            disabled={!selectedItems || selectedItems.length === 0}
        >
            Thanh toán
        </button>

    );
}

export default CheckOutButton;
