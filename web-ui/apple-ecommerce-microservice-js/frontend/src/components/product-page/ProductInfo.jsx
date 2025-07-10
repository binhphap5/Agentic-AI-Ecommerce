import React from "react";
import ColorSelector from "./ColorSelector";
import AddToCartButton from "./AddToCartButton";
import './Product.css';

function ProductInfo({
    product,
    sameNameProducts,
    selectedColor,
    quantity,
    handleColorSelect,
    handleQuantityChange,
    formatPrice
}) {
    if (!product) {
        return null;
    }

    return (
        <div className="flex flex-col w-full lg:max-w-lg">
            <h1 className="text-3xl font-semibold mb-3">{product.name}</h1>

            <span className="text-xl font-bold text-emerald-600 mb-2">
                {formatPrice(product.price)}
            </span>

            {product.storage && (
                <div className="mb-4">
                    <label className="text-lg font-medium mr-2">Dung lượng:</label>
                    <span>{product.storage}</span>
                </div>
            )}

            <ColorSelector
                sameNameProducts={sameNameProducts}
                selectedColor={selectedColor}
                handleColorSelect={handleColorSelect}
                product={product}
            />

            {/* Quantity Selector */}
            <div className="mb-6">
                <label className="block text-lg font-medium mb-2">Số lượng:</label>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        -
                    </button>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        min="1"
                        className="no-spinner w-20 h-10 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 "
                    />
                    <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                        +
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Tổng tiền: <span className="font-semibold text-emerald-600">
                        {formatPrice(product.price * quantity)}
                    </span>
                </p>
            </div>

            <AddToCartButton 
                product={product}
                quantity={quantity}
            />
        </div>
    );
}

export default ProductInfo;