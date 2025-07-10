import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Context } from "../../App";
import { Link } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa";
import LoadingSpinner from "../common/LoadingSpinner"; 

function CartTable({ cartItems, setCartItems, selectedItems, setSelectedItems }) {
    const [cartCounter, setCartCounter] = useContext(Context);
    const [selectAll, setSelectAll] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 
    const user = JSON.parse(localStorage.getItem("user"));

    const formatPrice = (price) => new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price || 0);

    const setLocalStorage = (updatedCart) => {
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const handleQuantityChange = async (e, itemId) => {
        const quantity = Math.max(Number(e.target.value), 1);
        const updatedCart = cartItems.map(item =>
            item._id === itemId ? { ...item, quantity } : item
        );
        setCartItems(updatedCart);
        setLocalStorage(updatedCart);

        const currentItem = updatedCart.find(item => item._id === itemId);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${user._id}/update/${currentItem.productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity }),
            });

            if (res.ok) toast.success("Cập nhật số lượng thành công");
            else toast.error("Lỗi khi cập nhật số lượng");
        } catch {
            toast.error("Lỗi kết nối");
        }
    };

    const handleRemove = async (itemId) => {
        const confirmDelete = window.confirm("Bạn có chắc muốn xóa sản phẩm này?");
        if (!confirmDelete) return;

        setIsLoading(true); 
        setTimeout(async () => {
            const itemToRemove = cartItems.find(item => item._id === itemId);
            const updatedCart = cartItems.filter(item => item._id !== itemId);
            setCartItems(updatedCart);
            setLocalStorage(updatedCart);
            setCartCounter(updatedCart.length);

            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${user._id}/remove/${itemToRemove.productId}`, {
                    method: "DELETE",
                });

                if (res.ok) toast.success("Xóa sản phẩm thành công");
                else toast.error("Lỗi khi xóa sản phẩm");
            } catch {
                toast.error("Lỗi kết nối khi xóa sản phẩm");
            } finally {
                setIsLoading(false); 
            }
        }, 2200); 
    };

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems([]);
        } else {
            const allIds = cartItems.map(item => item._id);
            setSelectedItems(allIds);
        }
        setSelectAll(!selectAll);
    };

    useEffect(() => {
        setSelectAll(selectedItems.length === cartItems.length && cartItems.length > 0);
    }, [selectedItems, cartItems]);

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return toast.warning("Chưa chọn sản phẩm nào để xóa");
        const confirmDelete = window.confirm("Bạn có chắc muốn xóa các sản phẩm đã chọn?");
        if (!confirmDelete) return;

        setIsLoading(true); 
        setTimeout(async () => {
            const updatedCart = cartItems.filter(item => !selectedItems.includes(item._id));
            setCartItems(updatedCart);
            setLocalStorage(updatedCart);
            setCartCounter(updatedCart.length);

            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/${user._id}/bulk-remove`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productIds: selectedItems.map(id => {
                            const item = cartItems.find(i => i._id === id);
                            return item?.productId;
                        })
                    })
                });

                if (response.ok) {
                    toast.success("Đã xóa các sản phẩm đã chọn");
                    setSelectedItems([]);
                } else {
                    toast.error("Lỗi khi xóa hàng loạt");
                }
            } catch {
                toast.error("Không thể kết nối đến server");
            } finally {
                setIsLoading(false); 
            }
        }, 2200); 
    };

    

    return (
        <div className="w-11/12 md:w-4/5 mx-auto">
            {isLoading && <LoadingSpinner />}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Giỏ hàng</h2>
                {selectedItems.length > 0 && (
                    <button
                        onClick={handleDeleteSelected}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <FaTrashAlt size={16} />
                        Xóa đã chọn ({selectedItems.length})
                    </button>
                )}
            </div>

            <table className="w-full">
                <thead className="border-b">
                    <tr className="text-left">
                        <th className="py-3 font-normal">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="py-3 font-normal">Sản phẩm</th>
                        <th className="py-3 font-normal">Dung lượng</th>
                        <th className="py-3 font-normal">Màu sắc</th>
                        <th className="py-3 font-normal">Số lượng</th>
                        <th className="py-3 font-normal text-right w-1/4">Tổng</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody className="border-b">
                    {cartItems.map(item => {
                        const product = item.product || {};
                        const price = item.price || 0;

                        return (
                            <tr key={item._id} className="border-b">
                                <td className="py-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item._id)}
                                        onChange={() => handleSelectItem(item._id)}
                                    />
                                </td>
                                <td className="py-10">
                                    <div className="flex items-center">
                                        <Link to={`/products/${item.productId}`}>
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                width={100}
                                                height={100}
                                                className="mr-4 hover:opacity-80 transition"
                                            />
                                        </Link>
                                        <div className="flex flex-col">
                                            <Link to={`/products/${item.productId}`}>
                                                <span className="text-lg font-medium text-gray-900 hover:underline">
                                                    {product.name}
                                                </span>
                                            </Link>
                                            <span className="pt-2">{formatPrice(price)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-10">
                                    <span className="border px-3 py-1 rounded bg-gray-100">{item.size}</span>
                                </td>
                                <td className="py-10">
                                    <span className="border px-3 py-1 rounded bg-gray-100">{item.color}</span>
                                </td>
                                <td className="py-10">
                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(e, item._id)}
                                        className="border border-gray-300 px-4 py-1 rounded text-center w-16"
                                    />
                                </td>
                                <td className="py-10 text-right">
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(price * item.quantity)}
                                    </span>
                                </td>
                                <td className="py-10 text-right">
                                    <button
                                        onClick={() => handleRemove(item._id)}
                                        className="text-red-600 ml-4 hover:text-red-800"
                                        title="Xóa sản phẩm"
                                    >
                                        <FaTrashAlt size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default CartTable;
