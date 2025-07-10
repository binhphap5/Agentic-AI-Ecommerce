import React from "react";
import ProductDescription from "./ProductDescription";
import ProductSpecifications from './ProductSpecification';
import ProductReviews from "./ProductReviews";

function ProductTabs({
    product,
    setProduct,
    activeTab,
    setActiveTab,
    user,
    formatPrice
}) {
    const tabs = [
        {
            id: "description",
            label: "Mô tả sản phẩm",
            component: <ProductDescription product={product} />
        },
        {
            id: "specifications",
            label: "Thông số kỹ thuật",
            component: <ProductSpecifications product={product} formatPrice={formatPrice} />
        },
        {
            id: "reviews",
            label: `Đánh giá (${product?.comments?.length || 0})`,
            component: <ProductReviews product={product} setProduct={setProduct} user={user} />
        }
    ];

    return (
        <div className="max-w-screen-lg mx-auto mt-10 px-4 md:px-0">
            {/* Tab Navigation */}
            <div className="flex justify-center border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {tabs.find(tab => tab.id === activeTab)?.component}
            </div>
        </div>
    );
}

export default ProductTabs;