import React, { useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import Loader from "../../components/Loader";

function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = "Họ và tên không được để trống.";
    if (!phone) newErrors.phone = "Số điện thoại không được để trống.";
    if (!email) newErrors.email = "Email không được để trống.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email không hợp lệ.";
    if (!address) newErrors.address = "Địa chỉ không được để trống.";
    if (!password) newErrors.password = "Mật khẩu không được để trống.";
    else if (password !== rePassword) newErrors.rePassword = "Mật khẩu không khớp.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    if (errors[field]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: undefined,
      }));
    }

    switch (field) {
      case "name":
        setName(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "address":
        handleAddressChange(e);
        break;
      case "password":
        setPassword(value);
        break;
      case "rePassword":
        setRePassword(value);
        break;
      default:
        break;
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);

    if (value) {
      fetchAddressDetails(value.toLowerCase());
    } else {
      setSuggestions([]);
    }
  };

  let debounceTimer;

  const fetchAddressDetails = (address) => {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://rsapi.goong.io/Geocode?api_key=85ULWPd6cLGhmsrM661hLSaG53zd1zfxdfp8Xiu3&address=${encodedAddress}`
        );

        if (!response.ok) throw new Error("Lỗi khi gọi API địa chỉ");

        const data = await response.json();

        if (data?.results?.length > 0) {
          setSuggestions(data.results);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("API Error:", err);
        toast.error("Không thể lấy địa chỉ. Vui lòng thử lại sau.");
        setSuggestions([]);
      }
    }, 500);
  };

  const handleSelectSuggestion = (suggestion) => {
    setAddress(suggestion.formatted_address);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (validate()) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            address,
            password,
          }),
        });

        const data = await response.json();
        setIsLoading(false);

        if (response.ok) {
          toast.success(data.message);
          setName("");
          setPhone("");
          setEmail("");
          setAddress("");
          setPassword("");
          setRePassword("");
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        setIsLoading(false);
        toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {isLoading && <Loader text="Hệ thống đang xử lý..." />}
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-lg mt-8 mb-8">
        <h2 className="text-3xl font-bold text-center mb-6">Tạo tài khoản</h2>

        <h3 className="text-xl font-semibold text-gray-700 mb-4">Thông tin liên hệ</h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input
                type="text"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-indigo-600"
                placeholder="Nhập họ và tên"
                value={name}
                onChange={(e) => handleInputChange(e, "name")}
              />
              {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-indigo-600"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => handleInputChange(e, "phone")}
              />
              {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
              <input
                type="email"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-indigo-600"
                placeholder="Nhập địa chỉ Email"
                value={email}
                onChange={(e) => handleInputChange(e, "email")}
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <input
              type="text"
              className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-indigo-600"
              placeholder="Nhập địa chỉ"
              value={address}
              onChange={(e) => handleInputChange(e, "address")}
            />
            {errors.address && <p className="text-red-600 text-sm">{errors.address}</p>}
            {suggestions.length > 0 && (
              <ul className="bg-white border mt-2 max-h-48 overflow-y-auto rounded-md shadow-md relative z-10">
                {suggestions.map((s, index) => (
                  <li
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.formatted_address}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-700 mb-4">Mật khẩu</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input
                type="password"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-indigo-600"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => handleInputChange(e, "password")}
              />
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
              <input
                type="password"
                className="mt-2 p-3 w-full border border-gray-300 rounded-md focus:ring-indigo-600"
                placeholder="Nhập lại mật khẩu"
                value={rePassword}
                onChange={(e) => handleInputChange(e, "rePassword")}
              />
              {errors.rePassword && <p className="text-red-600 text-sm">{errors.rePassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-black p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Đăng ký
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Đăng nhập ở đây
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
