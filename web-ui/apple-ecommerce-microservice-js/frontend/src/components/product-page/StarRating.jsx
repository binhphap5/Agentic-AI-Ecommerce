import React from "react";

function StarRating({ rating, size = "w-5 h-5", interactive = false, onClick }) {
    const handleStarClick = (starRating) => {
        if (interactive && onClick) {
            onClick(starRating);
        }
    };

    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    onClick={() => handleStarClick(star)}
                    className={`${size} ${interactive ? 'cursor-pointer' : ''} ${
                        star <= rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        fillRule="evenodd"
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                        clipRule="evenodd"
                    />
                </svg>
            ))}
        </div>
    );
}

export default StarRating;