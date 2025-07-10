import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

function ProductImageGallery({
    product,
    sameNameProducts,
    mainImage,
    handleImageSelect
}) {
    return (
        <div className="flex justify-center mb-8 lg:mb-0">
            <div className="flex flex-col items-center">
                {/* Main Image */}
                <LazyLoadImage
                    effect="blur"
                    src={mainImage}
                    alt={product?.name || "Product"}
                    className="w-[400px] h-[400px] object-contain mb-4 border rounded shadow-sm"
                    onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x400?text=No+Image";
                    }}
                />

                {/* Thumbnail Images */}
                <div className="flex gap-3 flex-wrap justify-center">
                    {sameNameProducts
                        .filter((item) => item.name === product?.name)
                        .map((item, index) => {
                            
                            return (
                                <img
                                    key={`${item._id}-${index}`}
                                    src={item.image}
                                    alt={`thumbnail-${item.color}-${index}`}
                                    onClick={() => {
                                        handleImageSelect(item);
                                    }}
                                    className={`w-20 h-20 object-cover rounded border cursor-pointer transition-all ${
                                        item.image === mainImage 
                                            ? "border-blue-500 ring-2 ring-blue-200" 
                                            : "border-gray-300 hover:border-gray-400"
                                    }`}
                                    onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                                    }}
                                />
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default ProductImageGallery;