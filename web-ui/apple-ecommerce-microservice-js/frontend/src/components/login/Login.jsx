import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Init Google Sign-In when component mounts
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSuccess,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large", width: "100%" }
        );
      }
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);
  }, []);

  // Google Sign-In success handler
  const handleGoogleSuccess = async (response) => {
    const { credential } = response;
    if (!credential) return toast.error("Đăng nhập Google thất bại.");

    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.token || !data.user) {
        toast.error(data.message || "Đăng nhập thất bại.");
        return;
      }

      saveLoginData(data);
    } catch (err) {
      toast.error("Lỗi khi đăng nhập bằng Google.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.warn("Vui lòng điền đầy đủ thông tin.");

    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token || !data.user) {
        toast.error(data.message || "Sai email hoặc mật khẩu.");
        return;
      }

      saveLoginData(data);
    } catch (err) {
      toast.error("Đăng nhập thất bại. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save token, user, cart and redirect
  const saveLoginData = async ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Optional: fetch cart
    try {
      const res = await fetch(`${backendUrl}/api/cart/${user._id}`);
      const cart = await res.json();
      localStorage.setItem("cart", JSON.stringify(cart.items || []));
    } catch (err) {
      console.warn("Không thể lấy giỏ hàng.");
    }

    toast.success("Đăng nhập thành công!");
    setTimeout(() => {
      navigate("/");
      window.location.reload();
    }, 2200);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {isLoading && <Loader text="Đang xử lý..." />}

      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 p-3 w-full border border-gray-300 rounded-md"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              className="mt-1 p-3 w-full border border-gray-300 rounded-md"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-6 text-right">
            <a href="/recovery" className="text-red-500 hover:text-red-700">
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">Hoặc</div>

        <div id="googleSignInDiv" className="w-full flex justify-center mb-2" />

        <p className="text-sm text-center mt-4">
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Đăng ký tại đây
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
