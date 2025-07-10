import React from "react";

function ProductSpecifications({ product, formatPrice }) {
    return (
        <div className="py-6">
            <h3 className="text-2xl font-semibold mb-6">Thông số kỹ thuật</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thông tin cơ bản */}
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">
                        Thông tin cơ bản
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-600">Tên sản phẩm:</span>
                            <span className="text-gray-900">{product.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-600">Màu sắc:</span>
                            <span className="text-gray-900">{product.color}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-600">Giá:</span>
                            <span className="text-emerald-600 font-semibold">{formatPrice(product.price)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-medium text-gray-600">Tình trạng:</span>
                            <span className="text-green-600 font-medium">Còn hàng</span>
                        </div>
                    </div>
                </div>

                {/* Thông số kỹ thuật */}
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">
                        Cấu hình chi tiết
                    </h4>
                    <div className="space-y-3">
                        {product.ram && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="font-medium text-gray-600">RAM:</span>
                                <span className="text-gray-900">{product.ram}</span>
                            </div>
                        )}
                        {product.storage && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="font-medium text-gray-600">Dung lượng:</span>
                                <span className="text-gray-900">{product.storage}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-600">Hệ điều hành:</span>
                            <span className="text-gray-900">Cập nhật sau</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-medium text-gray-600">Bảo hành:</span>
                            <span className="text-gray-900">12 tháng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thông tin bổ sung */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-indigo-800">
                    Thông tin bổ sung
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl mb-2">📦</div>
                        <h5 className="font-semibold text-gray-800">Miễn phí vận chuyển</h5>
                        <p className="text-sm text-gray-600">Với đơn hàng trên 500k</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl mb-2">🔒</div>
                        <h5 className="font-semibold text-gray-800">Bảo mật thanh toán</h5>
                        <p className="text-sm text-gray-600">An toàn 100%</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl mb-2">💬</div>
                        <h5 className="font-semibold text-gray-800">Hỗ trợ 24/7</h5>
                        <p className="text-sm text-gray-600">Tư vấn nhiệt tình</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductSpecifications;