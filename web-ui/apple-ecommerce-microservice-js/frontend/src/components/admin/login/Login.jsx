import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Loader from "../../../components/Loader"; // Import Loader component

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  // Tài khoản admin mặc định
  const adminUsername = "admin";
  const adminPassword = "123";

  const handleLogin = async (e) => {
    e.preventDefault();

    // Kiểm tra tài khoản và mật khẩu
    if (username === adminUsername && password === adminPassword) {
      setIsLoading(true); // Bắt đầu loading

      setTimeout(() => {
        toast.success("Đăng nhập admin thành công!", {
          position: "top-right",
          autoClose: 2000,
        });

        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem("user", JSON.stringify({ username }));

        // Chuyển hướng đến trang admin
        navigate("/admin/home");
      }, 2000); // Thêm delay để cải thiện trải nghiệm người dùng

    } else {
      toast.error("Tên đăng nhập hoặc mật khẩu không đúng.", {
        position: "top-right",
        autoClose: 3000,
      });
    }

    setIsLoading(false); // Dừng loading
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {isLoading && <Loader text="Đang đăng nhập..." />} {/* Hiển thị loader trong khi đăng nhập */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập Admin</h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-black"}`}
            disabled={isLoading} // Vô hiệu hóa nút khi đang loading
          >
            Đăng nhập
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Đăng ký ngay!
            </a>
          </p>
        </div>
      </div>

       
    </div>
  );
}

export default AdminLogin;
