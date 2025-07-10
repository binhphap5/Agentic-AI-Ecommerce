import React from "react";

function ProductDescription({ product }) {
    return (
        <div className="py-6">
            <h3 className="text-2xl font-semibold mb-4">Mô tả sản phẩm</h3>
            <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg mb-4">
                    {product.description || "Thông tin mô tả sản phẩm sẽ được cập nhật sớm."}
                </p>
                
                {/* Thêm nội dung mô tả chi tiết hơn */}
                <div className="bg-gray-50 rounded-lg p-6 mt-6">
                    <h4 className="text-lg font-semibold mb-3">Đặc điểm nổi bật</h4>
                    <ul className="space-y-2 text-gray-700">
                        <li>• Thiết kế hiện đại, sang trọng</li>
                        <li>• Chất lượng cao, độ bền tốt</li>
                        <li>• Phù hợp với nhiều đối tượng sử dụng</li>
                        <li>• Bảo hành chính hãng</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ProductDescription;