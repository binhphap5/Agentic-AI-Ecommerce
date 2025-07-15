import React from "react";
import { useNavigate } from "react-router-dom";

function AddToCartButton({ product }) {
    const navigate = useNavigate();

    const handleViewProduct = () => {
        if (!product || !product._id) {
            return;
        }
        navigate(`/products/${product._id}`);
    };

    return (
        <button
            className="text-sm p-1 mt-2.5 w-32 transition ease-in duration-200 bg-white hover:bg-gray-800 text-black hover:text-black border border-gray-300"
            onClick={handleViewProduct}
        >
            Xem thông tin
        </button>
    );
}

export default AddToCartButton;
