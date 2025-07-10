import React from "react";

function ErrorMessage({ error, onGoHome, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="text-center max-w-md">
                {/* Error Icon */}
                <div className="mx-auto mb-6">
                    <svg
                        className="w-24 h-24 text-red-500 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>

                {/* Error Title */}
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    Oops! Có lỗi xảy ra
                </h1>

                {/* Error Message */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                    {error || "Không thể tải dữ liệu. Vui lòng thử lại sau."}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Thử lại
                        </button>
                    )}
                    
                    {onGoHome && (
                        <button
                            onClick={onGoHome}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            Về trang chủ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ErrorMessage;