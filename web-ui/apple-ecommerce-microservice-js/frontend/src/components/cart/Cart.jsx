import React, { useState, useEffect, useCallback, useMemo } from "react";
import TotalPrice from "./TotalPrice";
import CartTable from "./CartTable";
import CheckOutButton from "./CheckOutButton.jsx";
import TitleMessage from "./TitleMessage";

function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const user = useMemo(() => {
        try {
            const userData = localStorage.getItem("user");
            return userData ? JSON.parse(userData) : null;
        } catch (err) {
            console.error("Error parsing user data:", err);
            return null;
        }
    }, []);

    const fetchCartData = useCallback(async (showLoading = true) => {
        if (!user || !user._id) {
            setLoading(false);
            return;
        }

        try {
            if (showLoading) setLoading(true);
            setError(null);

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${user._id}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const cartData = await res.json();
            const items = cartData.items || [];

            // Fetch product details
            const enrichedItems = await Promise.all(items.map(async (item) => {
                try {
                    const productRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${item.product}`);
                    if (!productRes.ok) throw new Error("Product not found");
                    const product = await productRes.json();

                    return {
                        _id: item._id,
                        productId: item.product,
                        product,
                        quantity: item.quantity,
                        color: item.color,
                        storage: item.storage,
                        size: item.storage,
                        price: item.price,
                        image: product?.image || "", // fallback rỗng nếu không có
                    };
                } catch (err) {
                    console.warn("Product detail fetch failed:", err);
                    return {
                        _id: item._id,
                        productId: item.product,
                        product: null,
                        quantity: item.quantity,
                        color: item.color,
                        storage: item.storage,
                        size: item.storage,
                        price: item.price,
                        image: "",
                    };
                }
            }));

            setCartItems(enrichedItems);
            localStorage.setItem("cart", JSON.stringify(enrichedItems));

        } catch (err) {
            console.error("Fetch cart error:", err);
            setError("Failed to fetch cart");

            // fallback từ localStorage nếu có
            try {
                const fallbackCart = localStorage.getItem("cart");
                if (fallbackCart) setCartItems(JSON.parse(fallbackCart));
            } catch (e) {
                console.warn("Fallback localStorage error:", e);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCartData();
    }, [fetchCartData]);

    useEffect(() => {
        const handleCartUpdate = () => {
            fetchCartData(false); // update không loading
        };
        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, [fetchCartData]);

    if (loading) {
        return (
            <div className="max-w-screen-2xl mx-auto p-9 pt-24">
                <TitleMessage />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-4 text-lg">Loading cart...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-screen-2xl mx-auto p-9 pt-24">
                <TitleMessage />
                <div className="text-center text-red-600 mb-8">
                    <p className="text-lg mb-4">Error loading cart: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-screen-2xl mx-auto p-9 pt-24">
            <TitleMessage />
            {cartItems.length > 0 ? (
                <>
                    <CartTable cartItems={cartItems} setCartItems={setCartItems} selectedItems={selectedItems} setSelectedItems={setSelectedItems}/>

                    <div className="flex flex-col items-end text-right w-11/12 md:w-4/5 mx-auto">
                        <TotalPrice cartItems={cartItems} selectedItems={selectedItems}/>
                        <CheckOutButton cartItems={cartItems} selectedItems={selectedItems} />
                    </div>
                </>
            ) : (
                <div className="text-center mb-32">
                    <p className="text-lg mb-4">Your cart is empty.</p>
                    <a
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Shopping Now
                    </a>
                </div>
            )}
        </div>
    );
}

export default Cart;
