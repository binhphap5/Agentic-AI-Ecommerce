import React from "react";

function LoadingSpinner({ size = "large", message = "Đang tải..." }) {
    const sizeClasses = {
        small: "w-6 h-6",
        medium: "w-10 h-10",
        large: "w-16 h-16"
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-30 flex flex-col items-center justify-center">
            <div className={`${sizeClasses[size]} animate-spin`}>
                <div className="w-full h-full border-4 border-gray-200 border-t-orange-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-white text-lg">{message}</p>
        </div>
    );
}

export default LoadingSpinner;
