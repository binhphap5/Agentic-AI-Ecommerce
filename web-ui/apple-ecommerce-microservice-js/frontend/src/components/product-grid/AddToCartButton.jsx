import React, { useContext } from "react";
import { Context } from "../../App.jsx";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom"; // Use useNavigate in React Router v6

function AddToCartButton({ product, selectedSize }) {
    const [cartCounter, setCartCounter] = useContext(Context);
    const navigate = useNavigate(); // Use useNavigate instead of useHistory

    const handleAddToCart = async () => {
    const rawUser = JSON.parse(localStorage.getItem("user"));
    const user = rawUser?.user || rawUser;

    if (!user || !user._id) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
        navigate("/login");
        return;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${user._id}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                productId: product._id,
                quantity: 1,
                size: selectedSize, // Backend cần hỗ trợ size!
            }),
        });

        if (!response.ok) throw new Error("Failed to add to cart");

        const updatedCart = await response.json();

        localStorage.setItem("cart", JSON.stringify(updatedCart.items));
        setCartCounter(updatedCart.items.length);
        toast.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
        console.error("Lỗi khi thêm vào giỏ:", error);
        toast.error("Thêm vào giỏ hàng thất bại.");
    }
};


    return (
        <button
            className="text-sm p-1 mt-2.5 w-32 transition ease-in duration-200 bg-white hover:bg-gray-800 text-black hover:text-black border border-gray-300"
            onClick={handleAddToCart}
        >
            Thêm vào giỏ
        </button>
    );
}

export default AddToCartButton;
