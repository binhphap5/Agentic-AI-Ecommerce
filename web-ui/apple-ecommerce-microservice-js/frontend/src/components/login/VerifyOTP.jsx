import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";

function VerifyOTP() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // Step 1: Enter email, Step 2: Enter OTP, Step 3: Change password
  const [timer, setTimer] = useState(300); // 5 minutes countdown (in seconds)
  const [isLoading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Start countdown when OTP is sent
  useEffect(() => {
    let interval;
    if (timer > 0 && step === 2) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      toast.error("Mã OTP đã hết hạn.");
      setStep(1); // Reset to step 1 if OTP expired
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  const handleSendOTP = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email hợp lệ.");
      return;
    }

    setLoading(true); // Set loading to true when sending OTP

    try {
      // API call to send OTP (adjust to use email instead of phone)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Mã OTP đã được gửi!");
        setStep(2);
        setTimer(300);
      } else {
        toast.error(data.message || "Gửi OTP thất bại.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      toast.error("Vui lòng nhập mã OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Xác minh thành công!");
        setStep(3); // Move to password reset step
      } else {
        toast.error(data.message || "Mã OTP không hợp lệ.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập cả mật khẩu mới và xác nhận mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Mật khẩu đã được thay đổi thành công!");
        setTimeout(() => navigate("/login"), 2000); // Redirect to login page after reset
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi thay đổi mật khẩu.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Format timer as mm:ss
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {isLoading && <Loader text="Hệ thống đang xử lý..." />} {/* Show loader while loading */}

      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">
          {step === 1
            ? "Xác minh email của bạn"
            : step === 2
            ? "Nhập mã OTP"
            : "Thay đổi mật khẩu"}
        </h2>

        {step === 1 ? (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSendOTP}
              className="mt-4 w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2"
            >
              Gửi mã OTP
            </button>
          </div>
        ) : step === 2 ? (
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Mã OTP
            </label>
            <input
              type="text"
              id="otp"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              onClick={handleVerifyOTP}
              className="mt-4 w-full p-3 bg-green-600 text-black rounded-md hover:bg-green-700 focus:outline-none focus:ring-2"
            >
              Xác minh
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Mã OTP sẽ hết hạn trong {formatTime(timer)}.
            </p>
          </div>
        ) : (
          <div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                id="newPassword"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleResetPassword}
              className="mt-6 w-full p-3 bg-green-600 text-black rounded-md hover:bg-green-700 focus:outline-none focus:ring-2"
            >
              Đặt lại mật khẩu
            </button>
          </div>
        )}

         
      </div>
    </div>
  );
}

export default VerifyOTP;
