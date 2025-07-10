import React, { useState } from "react";
import { toast } from "react-toastify";
import StarRating from "./StarRating";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

function ProductReviews({ product, setProduct, user }) {
    const [comment, setComment] = useState("");
    const [starRating, setStarRating] = useState(0);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!user?.email) {
            toast.error("Bạn phải đăng nhập để bình luận!");
            return;
        }
        
        if (!comment.trim()) {
            toast.error("Vui lòng nhập nội dung bình luận!");
            return;
        }
        
        if (starRating === 0) {
            toast.error("Vui lòng chọn số sao!");
            return;
        }

        const commentData = { 
            email: user.email, 
            comment: comment.trim(), 
            star: starRating,
            imageUrl: user.imageUrl || "https://i.ibb.co/sthmNhK/avatar-4.png"
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${product._id}/comments`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(commentData),
            });

            const data = await res.json();

            if (res.ok) {
                setProduct(data.product); 
                setComment("");
                setStarRating(0);
                toast.success("Thêm bình luận thành công!");
            } else {
                toast.error(data.message || "Gửi bình luận thất bại");
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
            toast.error("Có lỗi xảy ra khi gửi bình luận");
        }
    };

    const handleDeleteComment = async (commentIndex) => {
        if (!user?.email) {
            toast.error("Bạn phải đăng nhập!");
            return;
        }
        
        if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) {
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${product._id}/comments/${commentIndex}`, {
                method: "DELETE",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userEmail: user.email }),
            });

            const data = await res.json();

            if (res.ok) {
                setProduct(data.product);
                toast.success("Xóa bình luận thành công!");
            } else {
                toast.error(data.message || "Không thể xóa bình luận");
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Có lỗi xảy ra khi xóa bình luận");
        }
    };

    return (
        <div className="py-6">
            <h3 className="text-2xl font-semibold mb-6">Bình luận & Đánh giá</h3>
            
            <CommentForm
                user={user}
                comment={comment}
                setComment={setComment}
                starRating={starRating}
                setStarRating={setStarRating}
                onSubmit={handleCommentSubmit}
            />

            <CommentList
                comments={product?.comments || []}
                user={user}
                onDeleteComment={handleDeleteComment}
            />
        </div>
    );
}

export default ProductReviews;