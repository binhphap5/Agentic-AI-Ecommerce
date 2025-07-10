import React from "react";
import StarRating from "./StarRating";

function CommentList({ comments, user, onDeleteComment }) {
    // Function để tạo tên hiển thị hài hước và thú vị
    const getFunnyDisplayName = (email, index) => {
        if (!email) return `Khách Bí Ẩn ${index + 1}`;
        
        // Danh sách tên động vật dễ thương
        const animals = [
            'Gấu', 'Mèo', 'Chó', 'Thỏ', 'Cáo', 'Hổ', 'Sư Tử', 'Heo', 'Vịt', 'Gà',
            'Cừu', 'Bò', 'Ngựa', 'Khỉ', 'Voi', 'Hươu', 'Sóc', 'Chim', 'Cá', 'Rồng',
            'Phượng', 'Kỳ Lân', 'Ninja', 'Samurai', 'Siêu Nhân', 'Pháp Sư', 'Hiệp Sĩ'
        ];
        
        // Danh sách tính từ vui nhộn
        const adjectives = [
            'Dễ Thương', 'Ngầu Lòi', 'Bá Đạo', 'Siêu Cấp', 'Huyền Thoại', 'Thần Thánh',
            'Đáng Yêu', 'Quyến Rũ', 'Tinh Nghịch', 'Vui Vẻ', 'Thông Minh', 'Tài Giỏi',
            'Bựa Bựa', 'Hài Hước', 'Lầy Lội', 'Cute Xỉu', 'Pro Max', 'Xịn Xò',
            'Mlem Mlem', 'Kawaii', 'Badass', 'Chill Chill', 'Swag', 'Chanh Sả'
        ];
        
        // Tạo hash từ email
        const hash = email.split('').reduce((acc, char) => {
            return acc + char.charCodeAt(0);
        }, 0);
        
        const animalIndex = hash % animals.length;
        const adjIndex = (hash * 7) % adjectives.length;
        
        return `${animals[animalIndex]} ${adjectives[adjIndex]}`;
    };

    // Function để ẩn email hoàn toàn
    const maskEmail = (email) => {
        if (!email) return "***@***.com";
        
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return "***@***.com";
        
        // Chỉ hiển thị 1 ký tự đầu và domain bị ẩn
        return `${localPart[0]}***@***${domain.slice(-4)}`;
    };

    if (!comments || comments.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Chưa có bình luận nào cho sản phẩm này.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h4 className="text-lg font-semibold">
                Tất cả bình luận ({comments.length})
            </h4>
            
            {comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center mb-3">
                            <img
                                src={comment.imageUrl || "https://i.ibb.co/sthmNhK/avatar-4.png"}
                                alt="User Avatar"
                                className="w-10 h-10 rounded-full object-cover mr-3"
                                onError={(e) => {
                                    e.target.src = "https://i.ibb.co/sthmNhK/avatar-4.png";
                                }}
                            />
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {getFunnyDisplayName(comment.email, index)}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {maskEmail(comment.email)}
                                </p>
                                <div className="flex items-center mt-1">
                                    <StarRating rating={comment.star} size="w-4 h-4" />
                                    <span className="ml-2 text-sm text-gray-600">
                                        {comment.star} sao
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {user?.email === comment.email && (
                            <button
                                onClick={() => onDeleteComment(index)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Xóa
                            </button>
                        )}
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">
                        {comment.comment}
                    </p>
                    
                    {comment.createdAt && (
                        <p className="text-sm text-gray-500 mt-2">
                            {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default CommentList;