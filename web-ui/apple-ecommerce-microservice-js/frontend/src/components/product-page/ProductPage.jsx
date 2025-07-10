import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Breadcrumb from '../common/Breadcrumb';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import ProductTabs from './ProductTabs';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useProductData } from '../hooks/useProductData';
import { formatPrice } from '../utils/priceUtils';

function ProductPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    
    
    const {
        product,
        setProduct,
        sameNameProducts,
        mainImage,
        selectedColor,
        quantity,
        loading,
        error,
        handleColorSelect,
        handleImageSelect,
        handleQuantityChange
    } = useProductData(id, navigate);

    const [activeTab, setActiveTab] = useState("description");

    // Log khi product thay đổi
    // useEffect(() => {
    //     if (product) {
    //         console.log("📄 ProductPage - Product updated:", {
    //             id: product._id,
    //             name: product.name,
    //             color: product.color,
    //             price: product.price,
    //             image: product.image,
    //             storage: product.storage,
    //             quantity: quantity
    //         });
    //     }
    // }, [product]);

    if (error) {
        return <ErrorMessage error={error} onGoHome={() => navigate('/')} />;
    }

    if (!product) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-xl text-gray-600">Không tìm thấy sản phẩm</p>
            </div>
        );
    }


    return (
        <>
            <div className="max-w-screen-2xl mx-auto px-6 mt-6 mb-8">
                {loading && <LoadingSpinner />}
                {/* Breadcrumb */}
                <div className="flex flex-col lg:flex-row w-full gap-x-24 justify-center mb-6">
                    <div className="flex justify-center mb-8 lg:mb-0">
                        <Breadcrumb product={product} />
                    </div>
                    <div className="flex flex-col w-full lg:max-w-lg"></div>
                </div>

                {/* Product Details */}
                <div className="flex flex-col lg:flex-row w-full gap-x-24 justify-center">
                    <ProductImageGallery
                        product={product}
                        sameNameProducts={sameNameProducts}
                        mainImage={mainImage}
                        handleImageSelect={handleImageSelect}
                    />

                    <ProductInfo
                        product={product}
                        sameNameProducts={sameNameProducts}
                        selectedColor={selectedColor}
                        quantity={quantity}
                        handleColorSelect={handleColorSelect}
                        handleQuantityChange={handleQuantityChange}
                        formatPrice={formatPrice}
                    />
                </div>
            </div>

            <ProductTabs
                product={product}
                setProduct={setProduct}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                formatPrice={formatPrice}
            />
        </>
    );
}

export default ProductPage;