import React from "react";
import StarRating from "./StarRating";

function CommentForm({ user, comment, setComment, starRating, setStarRating, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="mb-8">
            {user?.email ? (
                <div className="flex items-center mb-4">
                    <img
                        src={user.imageUrl || "https://i.ibb.co/sthmNhK/avatar-4.png"}
                        alt="User Avatar"
                        className="w-12 h-12 rounded-full object-cover mr-4"
                        onError={(e) => {
                            e.target.src = "https://i.ibb.co/sthmNhK/avatar-4.png";
                        }}
                    />
                    <p className="font-semibold text-lg">{user.email}</p>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-yellow-800">
                        Vui lòng đăng nhập để bình luận và đánh giá sản phẩm.
                    </p>
                </div>
            )}

            <div className="flex flex-col mb-6">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    className="w-full border rounded-lg p-4 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!user?.email}
                    rows={4}
                />

                {/* Star Rating */}
                <div className="flex items-center mb-4">
                    <label className="mr-4 font-medium">Đánh giá:</label>
                    <StarRating
                        rating={starRating}
                        size="w-6 h-6"
                        interactive={true}
                        onClick={setStarRating}
                    />
                    {starRating > 0 && (
                        <span className="ml-2 text-sm text-gray-600">
                            ({starRating} sao)
                        </span>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        disabled={!user?.email || !comment.trim() || starRating === 0}
                    >
                        Gửi bình luận
                    </button>
                </div>
            </div>
        </form>
    );
}

export default CommentForm;