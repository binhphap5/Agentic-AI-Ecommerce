import React from "react";
import { Navigate } from "react-router-dom";

// ProtectedRoute Component
const ProtectedRoute = ({ element }) => {
  const user = localStorage.getItem("user"); // Lấy thông tin người dùng từ localStorage

  // Nếu không có người dùng đăng nhập, chuyển hướng đến trang login
  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  return element; // Nếu đã đăng nhập, cho phép truy cập vào route
};

export default ProtectedRoute;
