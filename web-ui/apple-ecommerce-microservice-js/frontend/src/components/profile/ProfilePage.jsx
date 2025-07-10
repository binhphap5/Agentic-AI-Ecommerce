import React, { useState, useEffect } from 'react';
import Loader from "../../components/Loader"; 
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import OrderManagement from "./OrderManagement"; 
import History from "./History";

const ProfilePage = () => {
    const storedUser = localStorage.getItem('user');
    const user = JSON.parse(storedUser);

    const initialUserInfo = {
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        location: user.address,
        province: user.province,
        district: user.district,
        ward: user.ward,
        password:user.password,
        imageUrl:user.imageUrl,
        newPassword: '',
        confirmPassword: '',
    };

    const [userInfo, setUserInfo] = useState(initialUserInfo);
    const [activeMenu, setActiveMenu] = useState('userInfo');
    const [opacity, setOpacity] = useState(0.5);
    const [screenSize, setScreenSize] = useState(window.innerWidth); // Detect screen size
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        
        setUserInfo({
            fullName: user.name,
            email: user.email,
            phone: user.phone,
            location: user.address,
            province: user.province,
            district: user.district,
            ward: user.ward,
            password:user.password,
            imageUrl:user.imageUrl,
            newPassword: '',
            confirmPassword: '',
        });

        const handleResize = () => setScreenSize(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMenuClick = (menu) => {
        setActiveMenu(menu);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserInfo({
            ...userInfo,
            [name]: value,
        });
    };

    const handleSave = async (event) => {
        event.preventDefault();
        setIsLoading(true);
    
        try {
            if (userInfo.newPassword !== userInfo.confirmPassword) {
                toast.error("Mật khẩu không khớp!", { position: "top-right" });
                setIsLoading(false);
                return;
            }

            let uploadedImageUrl = userInfo.imageUrl; // Giữ URL cũ nếu không có ảnh mới
    
            if (userInfo.image) {
                // Chỉ upload ảnh nếu có ảnh mới
                const data = new FormData();
                data.append("image", userInfo.image);
    
                const imageUploadResponse = await fetch(
                    "https://api.imgbb.com/1/upload?key=db96fd24d507bc171c6696ffb0bc1f6f",
                    { method: "POST", body: data }
                );
    
                const imageUploadData = await imageUploadResponse.json();
    
                if (imageUploadData.success) {
                    uploadedImageUrl = imageUploadData.data.url;
                } else {
                    console.error("Image upload failed:", imageUploadData);
                    toast.error("Tải ảnh lên thất bại, vui lòng thử lại.", { position: "top-right" });
                    return; // Ngừng tiến trình nếu upload ảnh thất bại
                }
            }
    
            // Cập nhật thông tin người dùng
            const updatedUser = {
                ...JSON.parse(localStorage.getItem("user")),
                user: {
                    ...JSON.parse(localStorage.getItem("user")).user,
                    imageUrl: uploadedImageUrl,
                    fullName: userInfo.fullName,
                    email: userInfo.email,
                    phone: userInfo.phone,
                    location: userInfo.location,
                    province: userInfo.province,
                    district: userInfo.district,
                    ward: userInfo.ward,
                    password: userInfo.newPassword || userInfo.password,
                },
            };
    
            localStorage.setItem("user", JSON.stringify(updatedUser));
    
            setUserInfo({ ...userInfo, imageUrl: uploadedImageUrl });
    
            const userData = {
                email: userInfo.email,
                fullName: userInfo.fullName,
                phone: userInfo.phone,
                location: userInfo.location,
                province: userInfo.province,
                district: userInfo.district,
                ward: userInfo.ward,
                password: userInfo.newPassword || userInfo.password,
                image: uploadedImageUrl,
            };
    
            const saveUserDataResponse = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/upload-image`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData),
                }
            );
    
            const saveUserDataResponseData = await saveUserDataResponse.json();
            console.log(saveUserDataResponseData);
    
            toast.success("Cập nhật thành công!", { position: "top-right" });

            setTimeout(() => {
                window.location.reload();  
            }, 2000);
            
        } catch (error) {
            console.error("Error saving user data:", error);
            toast.error("Đã xảy ra lỗi, vui lòng thử lại.", { position: "top-right" });
        } finally {
            setIsLoading(false);
        }
    };
    
    
    
    
    
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setUserInfo({
                ...userInfo,
                image: file, // Store the image file in the state
                imageUrl: imageUrl,
            });
        }
    };
    
    
    

    // const handleFileChange = (e) => {
    //     const file = e.target.files[0];
    //     if (file) {
    //         const reader = new FileReader();
    //         reader.onloadend = () => {
    //             setUserInfo({
    //                 ...userInfo,
    //                 imageUrl: reader.result, // Set the uploaded image as profile picture
    //             });
    //         };
    //         reader.readAsDataURL(file); // Convert the image to a base64 string
    //     }
    // };


    useEffect(() => {
        const hasChanges = Object.keys(userInfo).some(
            (key) => userInfo[key] !== initialUserInfo[key]
        );
        setOpacity(hasChanges ? 1 : 0.5);

        const handleResize = () => setScreenSize(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [userInfo]);

    return (
        <div className="flex flex-col lg:flex-row p-6 bg-gray-100">
            {isLoading && <Loader text="Hệ thống đang xử lý..." />} {/* Hiển thị loader */}

            {/* Sidebar */}
            <div className="lg:w-64 w-full bg-white p-6 shadow-lg">
                {/* Sidebar for large screens */}
                {screenSize >= 1024 ? (
                    <div className="lg:block">
                        <h3 className="text-xl font-semibold mb-6">Trang cá nhân</h3>
                        <ul>
                            <li
                                className={`text-lg mb-4 cursor-pointer ${activeMenu === 'userInfo' ? 'text-orange-500 font-semibold border-r-4 border-orange-500' : 'text-gray-600'}`}
                                onClick={() => handleMenuClick('userInfo')}
                            >
                                Thông tin người dùng
                            </li>
                
                            <li
                                className={`text-lg mb-4 cursor-pointer ${activeMenu === 'order' ? 'text-orange-500 font-semibold border-r-4 border-orange-500' : 'text-gray-600'}`}
                                onClick={() => handleMenuClick('order')}
                            >
                                Quản lý đơn hàng
                            </li>
                            <li
                                className={`text-lg mb-4 cursor-pointer ${activeMenu === 'history' ? 'text-orange-500 font-semibold border-r-4 border-orange-500' : 'text-gray-600'}`}
                                onClick={() => handleMenuClick('history')}
                            >
                                Lịch sử đặt hàng
                            </li>
                            <li
                                className={`text-lg mb-4 cursor-pointer ${activeMenu === 'notifications' ? 'text-orange-500 font-semibold border-r-4 border-orange-500' : 'text-gray-600'}`}
                                onClick={() => handleMenuClick('notifications')}
                            >
                                Thông báo
                            </li>
                        </ul>
                    </div>
                ) : (
                    // Sidebar as select dropdown for small screens
                    <div className="lg:hidden">
                        <h3 className="text-xl font-semibold mb-6">Trang cá nhân</h3>
                        <select
                            className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            value={activeMenu}
                            onChange={(e) => handleMenuClick(e.target.value)}
                        >
                            <option value="userInfo">Thông tin người dùng</option>
                            <option value="order">Quản lý đơn hàng</option>
                            <option value="history">Lịch sử đặt hàng</option>
                            <option value="notifications">Thông báo</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Profile Content */}
            <div className="flex-grow lg:ml-8 bg-white p-6 rounded-lg shadow-lg">
                {activeMenu === 'userInfo' && (
                    <div>
                        <div className="flex items-center mb-6 flex-col lg:flex-row">
                            <div className="relative mr-6 mb-4 lg:mb-0">
                                {userInfo.imageUrl ? (
                                    <img
                                    className="w-24 h-24 rounded-full border-2 border-gray-300 object-cover"
                                    src={userInfo.imageUrl}
                                    alt="Profile"
                                    />
                                ) : (
                                    <div className="w-24 h-24 flex items-center justify-center rounded-full bg-orange-500 text-white text-3xl font-bold">
                                    {userInfo.email.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <label htmlFor="fileInput" className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 border border-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4l4 4M12 12l6-6M2 18l4-4 10-10 4 4-10 10-4 4H2v-4z" />
                                    </svg>
                                </label>
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div>
                                <h2 className="text-2xl font-semibold">{userInfo.fullName}</h2>
                                <p className="text-gray-600">{userInfo.location}</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Thông tin cá nhân</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={userInfo.fullName}
                                    onChange={handleChange}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={userInfo.phone}
                                    onChange={handleChange}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Địa chỉ Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={userInfo.email}
                                    onChange={handleChange}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="Nhập địa chỉ Email"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={userInfo.location}
                                onChange={handleChange}
                                className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                placeholder="Nhập địa chỉ"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor="province" className="block text-sm font-medium text-gray-700">Tỉnh/thành</label>
                                <input
                                    type="text"
                                    id="province"
                                    name="province"
                                    value={userInfo.province}
                                    onChange={handleChange}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="Nhập tỉnh/thành"
                                />
                            </div>
                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-700">Quận/huyện</label>
                                <input
                                    type="text"
                                    id="district"
                                    name="district"
                                    value={userInfo.district}
                                    onChange={handleChange}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="Nhập quận/huyện"
                                />
                            </div>
                            <div>
                                <label htmlFor="ward" className="block text-sm font-medium text-gray-700">Phường/xã</label>
                                <input
                                    type="text"
                                    id="ward"
                                    name="ward"
                                    value={userInfo.ward}
                                    onChange={handleChange}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="Nhập phường/xã"
                                />
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Tài khoản đăng nhập</h3>

                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={userInfo.username}
                                className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                onChange={handleChange}
                                disabled // Disable input field
                                style={{ opacity: 0.5 }} // Apply opacity to indicate it's disabled
                            />
                        </div>

                        <div className="mb-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Mật khẩu hiện tại
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={userInfo.password}
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    disabled // Disable input field
                                    style={{ opacity: 0.5 }} // Apply opacity to indicate it's disabled
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                    Mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={userInfo.newPassword || ''} // Make sure it's controlled
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    onChange={handleChange} // Handle the change event
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Nhập lại mật khẩu
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={userInfo.confirmPassword || ''} // Make sure it's controlled
                                    className="mt-2 p-3 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    onChange={handleChange} // Handle the change event
                                />
                            </div>
                        </div> 

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className={`px-6 py-3 text-black rounded-md shadow-md transition ${opacity === 1 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 cursor-not-allowed'}`}
                                style={{ opacity }}
                                disabled={opacity < 1}
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                )}

                {activeMenu === 'order' && <OrderManagement />}
                {activeMenu === 'history' && <History />}   

            </div>
             

        </div>
    );
};

export default ProfilePage;
