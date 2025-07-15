import React, { useState, useContext, useEffect, useRef } from "react";
import { Context } from "../App.jsx";
import { BrowserRouter, NavLink} from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from "../components/Loader"; // Import Loader component

function Header({ navigationItems, hidden }) {
    // Sets state for mobile hamburger menu
    const [isOpen, setIsOpen] = useState(false);
    // Get cartCounter from useContext
    const [cartCounter, setCartCounter] = useContext(Context);
    // State for Profile menu (Login/Register options)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // State to manage loading


    // Create a reference to the profile menu
    const profileMenuRef = useRef(null);

    useEffect(() => {
        // Lấy thông tin user từ localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                // Cố gắng chuyển đổi chuỗi JSON thành object
                const user = JSON.parse(storedUser);
                setUser(user); // Set user information in state
            } catch (error) {
                console.error("Lỗi khi parse dữ liệu từ localStorage:", error);
            }
        } else {
            console.log("Chưa có thông tin user trong localStorage");
        }
    }, []);

    
    

    useEffect(() => {
        // Close the menu when click is detected outside the profile menu
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);  // Close the menu if the click is outside
            }
        };

        // Add the event listener when the component mounts
        document.addEventListener("mousedown", handleClickOutside);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
    const updateCartCounter = () => {
        try {
            const cartData = localStorage.getItem("cart");
            if (!cartData || cartData === "undefined") {
                localStorage.setItem("cart", JSON.stringify([]));
                setCartCounter(0);
                return;
            }
            
            const cart = JSON.parse(cartData);
            const count = Array.isArray(cart) ? cart.length : Object.keys(cart || {}).length;
            setCartCounter(count);
        } catch (error) {
            console.error("[Header] Error parsing cart:", error);
            localStorage.setItem("cart", JSON.stringify([]));
            setCartCounter(0);
        }
    };
    
    // Update on load
    updateCartCounter();

    // Listen to storage change (when user refreshes, or other tabs update cart)
    window.addEventListener("storage", updateCartCounter);

    return () => window.removeEventListener("storage", updateCartCounter);
    }, []);

    

    const handleLogout = () => {
        setIsLoading(true);
    
        localStorage.removeItem("user");
        localStorage.removeItem("cart")
        setCartCounter(0);
        setUser(null);  
        setProfileMenuOpen(false);  
        
        setTimeout(() => {
            
            setIsLoading(false); 
            window.location.href = '/';
        }, 2000); 
    };
    
    if(hidden) {
        return null
    }
    return (
        
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">

            {/* Logo */}
            <div className="max-w-screen-2xl flex flex-wrap items-center justify-between mx-auto p-5">
                <div className="">
                    <a href="/" className="flex flex-wrap items-center font-bold text-gray-500 ">
                        <img
                            src="/lkn.png"
                            className="w-10 h-10 mr-2"
                            alt="Logo"
                            width={100}
                            height={100}
                        />
                        LKN Privé
                    </a>
                </div>
                {/* Mobile hamburger icon */}
                <div className="block lg:hidden">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center px-3 py-2 rounded text-black-500 hover:text-black-400"
                    >
                        <svg
                            className={`fill-current h-6 w-6 ${isOpen ? "hidden" : "block"}`}
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
                        </svg>
                        <svg
                            className={`fill-current h-6 w-6 ${isOpen ? "block" : "hidden"}`}
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z" />
                        </svg>
                    </button>
                </div>

                {/* navigation links */}
                <div className={`w-full lg:flex lg:items-center lg:w-auto mt-4 lg:mt-0 ${isOpen ? "block" : "hidden"}`}>
                    <nav className="text-sm flex flex-col lg:flex-row lg:mt-0 relative top-4 lg:top-1 lg:items-center">
                        
                            <NavLink
                                reloadDocument
                                to="/"
                                className={({ isActive, isPending }) =>
                                    isPending
                                        ? "pending"
                                        : isActive
                                        ? "mb-4 lg:mb-0 lg:mx-3 lg:border-b lg:border-gray-700 lg:pb-1.5 relative top-1"
                                        : "mb-4 lg:mb-0 lg:mx-3"
                                }
                            >
                                IPhone
                            </NavLink>

                            <NavLink
                                reloadDocument
                                to="/IPad"
                                className={({ isActive, isPending }) =>
                                    isPending
                                        ? "pending"
                                        : isActive
                                        ? "mb-4 lg:mb-0 lg:mx-3 lg:border-b lg:border-gray-700 lg:pb-1.5 relative top-1"
                                        : "mb-4 lg:mb-0 lg:mx-3"
                                }
                            >
                                IPad
                            </NavLink>

                            {/* <NavLink
                                reloadDocument
                                to="/unisex"
                                className={({ isActive, isPending }) =>
                                    isPending
                                        ? "pending"
                                        : isActive
                                        ? "mb-4 lg:mb-0 lg:mx-3 lg:border-b lg:border-gray-700 lg:pb-1.5 relative top-1"
                                        : "mb-4 lg:mb-0 lg:mx-3"
                                }
                            >
                                Unisex
                            </NavLink> */}

                            {/* <NavLink
                                reloadDocument
                                to="/bodymist"
                                className={({ isActive, isPending }) =>
                                    isPending
                                        ? "pending"
                                        : isActive
                                        ? "mb-4 lg:mb-0 lg:mx-3 lg:border-b lg:border-gray-700 lg:pb-1.5 relative top-1"
                                        : "mb-4 lg:mb-0 lg:mx-3"
                                }
                            >
                                Body Mist
                            </NavLink> */}
                            
                            <NavLink
                                reloadDocument
                                to="cart"
                                className={({ isActive, isPending }) =>
                                    isPending
                                        ? "pending"
                                        : isActive
                                        ? "mb-4 lg:mb-0 lg:mx-3 lg:hidden"
                                        : "mb-4 lg:mb-0 lg:mx-3 lg:hidden"
                                }
                            >
                                Cart
                            </NavLink>
                     
                    </nav>
                </div>

                {/* Right side cart, profile and search icons */}
                <div id="header-icons" className="hidden lg:flex items-center">
                

                    {/* Cart Icon */}
                    <a
                        href={user ? "/cart" : "/login"} 
                        className="px-4 transition ease-in-out delay-75 hover:-translate-y-1 hover:scale-110 duration-300"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <circle cx="16.75" cy="19.949" r=".75"></circle>
                            <circle cx="9.75" cy="19.949" r=".75"></circle>
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M18 18.2a.5.5 0 0 0 0-1h-7.99a2.5 2.5 0 0 1-2.46-2.06l-.123-.688h9.16a2.5 2.5 0 0 0 2.355-1.66l1.55-4.34a1.5 1.5 0 0 0-1.413-2.004H5.997l-.065-.364A3.5 3.5 0 0 0 2.488 3.2h-.99a.5.5 0 1 0 0 1h.99a2.5 2.5 0 0 1 2.46 2.06l1.617 9.057a3.5 3.5 0 0 0 3.446 2.884H18ZM6.176 7.45l12.903-.001a.5.5 0 0 1 .47.668l-1.548 4.34a1.5 1.5 0 0 1-1.413.996h-9.34L6.176 7.45Z"
                            ></path>
                        </svg>
                        <div className="absolute">
                            {cartCounter > 0 ? (
                                <span className="bg-white text-black border text-xs relative bottom-9 left-4 py-0.5 px-1.5 rounded-full">
                                    {cartCounter}
                                </span>
                            ) : (
                                <></>
                            )}
                        </div>
                    </a>
                    
                    {/* Profile Icon with Toggle */}
                    <a
                        className="px-4 transition ease-in-out delay-75 hover:-translate-y-1 hover:scale-110 duration-300"
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    >   
                        {user ? (
                            <div className="flex items-center">
                                {user?.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover mr-2"
                                />
                                ) : (
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold mr-2">
                                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                )}
                                <p>{user.name}</p>
                            </div>
                            ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M16 5.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-12.5 14c0-2.143.486-3.732 1.596-4.796C7.212 13.634 9.058 13 12 13c2.942 0 4.788.635 5.904 1.704 1.11 1.064 1.596 2.652 1.596 4.796a.5.5 0 0 0 1 0c0-2.275-.514-4.186-1.904-5.518C17.212 12.656 15.058 12 12 12c-3.058 0-5.212.656-6.596 1.982C4.014 15.314 3.5 17.225 3.5 19.5a.5.5 0 0 0 1 0Z"
                                ></path>
                            </svg>
                        )}

                    </a>

                    {/* Profile menu */}
                    {profileMenuOpen && (
                        <div ref={profileMenuRef} className="absolute right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg py-2 w-48">

                            {user ? (
                                <>
                                    <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Thông tin cá nhân
                                    </a>
                                    <a onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Đăng xuất
                                    </a>
                                </>
                            ) : (
                                <>
                                    <a href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Login
                                    </a>
                                    <a href="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        Register
                                    </a>
                                </>
                            )}
                        </div>
                    )}

                    
                </div>
            </div>
             
        </header>
    );
}

export default Header;
