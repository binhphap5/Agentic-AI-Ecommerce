import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useProductData = (id, navigate) => {
    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [sameNameProducts, setSameNameProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch product by ID
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`);
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const data = await res.json();
                
                if (!data) {
                    throw new Error('Product not found');
                }
                
                setProduct(data);
                setMainImage(data.image);
                setSelectedColor(data.color);
                setQuantity(1); // Reset quantity when product changes

                // Fetch products with same name (different colors)
                const nameRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/by-name/${encodeURIComponent(data.name)}`);
                
                if (nameRes.ok) {
                    const nameVariants = await nameRes.json();
                    setSameNameProducts(nameVariants || []);
                } else {
                    console.warn('Could not fetch product variants');
                    setSameNameProducts([data]); // Fallback to current product
                }
                
            } catch (err) {
                console.error("❌ Error fetching product:", err);
                setError(err.message);
                toast.error("Không thể tải thông tin sản phẩm");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProductData();
        }
    }, [id]);

    const handleColorSelect = (selectedProduct) => {
        // Cập nhật toàn bộ product state
        setProduct(selectedProduct);
        setMainImage(selectedProduct.image);
        setSelectedColor(selectedProduct.color);
        setQuantity(1); // Reset quantity when color changes
    };

    const handleImageSelect = (selectedProduct) => {
        // Cập nhật toàn bộ product state khi click ảnh phụ
        setProduct(selectedProduct);
        setMainImage(selectedProduct.image);
        setSelectedColor(selectedProduct.color);
        setQuantity(1); // Reset quantity when image changes
    };

    const handleQuantityChange = (newQuantity) => {
        if (newQuantity < 1) {
            setQuantity(1);
        } else {
            setQuantity(newQuantity);
        }
    };

    return {
        product,
        sameNameProducts,
        mainImage,
        selectedColor,
        quantity,
        loading,
        error,
        setMainImage,
        setSelectedColor,
        setProduct,
        setQuantity,
        handleColorSelect,
        handleImageSelect,
        handleQuantityChange
    };
};