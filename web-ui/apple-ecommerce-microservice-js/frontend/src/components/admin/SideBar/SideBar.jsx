import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook

function SideBar() {
  const [activeTab, setActiveTab] = useState("dashboard"); // State to track the current active tab
  const navigate = useNavigate(); // Initialize useNavigate

  const handleTabClick = (tabName) => {
    setActiveTab(tabName); // Update the active tab
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // Remove the user item from localStorage
    navigate("/admin/login"); // Redirect to the login page
  };

  return (
    <div className="fixed z-50 flex min-h-full flex-col bg-white shadow-2xl shadow-white/5 transition-all dark:bg-navy-800 dark:text-black min-w-[10px]">
      <div className="mx-[56px] mt-[50px] flex items-center">
        <div className="mt-1 ml-1 h-2.5 font-poppins text-[26px] font-bold uppercase hidden text-navy-700 text-gray-600">
          EvolveX <span className="font-medium">Admin</span>
        </div>
      </div>
      <div className="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30"></div>
      <ul className="mb-auto pt-1">
        <a href="/admin/home">
          <div
            className={`relative mb-3 flex hover:cursor-pointer ${activeTab === "dashboard" ? "text-primary" : ""}`}
            onClick={() => handleTabClick("dashboard")}
          >
            <li className="my-[3px] flex cursor-pointer items-center px-8">
              <span className="font-bold text-brand-500 text-gray-600">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0" 
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path>
                </svg>
              </span>
              <p className="leading-1 ml-4 flex font-medium text-gray-600 hidden lg:block">
                Main Dashboard
              </p>
            </li>
            <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400"></div>
          </div>
        </a>
        <a href="/admin/product">
          <div
            className={`relative mb-3 items-center flex hover:cursor-pointer ${activeTab === "product" ? "text-primary" : ""}`}
            onClick={() => handleTabClick("product")}
          >
            <li className="my-[3px] flex cursor-pointer items-center px-8">
              <span className="font-medium text-gray-600">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0V0z"></path>
                  <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0020.01 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"></path>
                </svg>
              </span>
              <p className="leading-1 ml-4 flex font-medium text-gray-600 hidden lg:block">
                Product
              </p>
            </li>
          </div>
        </a>
        <a href="/admin/order">
          <div
            className={`relative mb-3 flex hover:cursor-pointer ${activeTab === "data-tables" ? "text-primary" : ""}`}
            onClick={() => handleTabClick("data-tables")}
          >
            <li className="my-[3px] flex cursor-pointer items-center px-8">
              <span className="font-medium text-gray-600">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M4 9h4v11H4zM16 13h4v7h-4zM10 4h4v16h-4z"></path>
                </svg>
              </span>
              <p className="leading-1 ml-4 flex font-medium text-gray-600 hidden lg:block">
                Orders
              </p>
            </li>
          </div>
        </a>
        <a href="/admin/account">
          <div
            className={`relative mb-3 flex hover:cursor-pointer ${activeTab === "profile" ? "text-primary" : ""}`}
            onClick={() => handleTabClick("profile")}
          >
            <li className="my-[3px] flex cursor-pointer items-center px-8">
              <span className="font-medium text-gray-600">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                </svg>
              </span>
              <p className="leading-1 ml-4 flex font-medium text-gray-600 hidden lg:block">
                Account
              </p>
            </li>
          </div>
        </a>
        <a href="">
          <div
            className={`relative mb-3 flex hover:cursor-pointer ${activeTab === "sign-in" ? "text-primary" : ""}`}
            onClick={handleLogout}
          >
            <li className="my-[3px] flex cursor-pointer items-center px-8">
              <span className="font-medium text-gray-600">
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 32 32"
                  className="h-6 w-6"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 9.875v12.219c0 1.125 0.469 2.125 1.219 2.906 0.75 0.75 1.719 1.156 2.844 1.156h6.125v-2.531h-6.125c-0.844 0-1.5-0.688-1.5-1.531v-12.219c0-0.844 0.656-1.5 1.5-1.5h6.125v-2.563h-6.125c-1.125 0-2.094 0.438-2.844 1.188-0.75 0.781-1.219 1.75-1.219 2.875zM6.719 13.563v4.875c0 0.563 0.5 1.031 1.063 1.031h5.656v3.844c0 0.344 0.188 0.625 0.5 0.781 0.125 0.031 0.25 0.031 0.313 0.031 0.219 0 0.406-0.063 0.563-0.219l7.344-7.344c0.344-0.281 0.313-0.844 0-1.156l-7.344-7.313c-0.438-0.469-1.375-0.188-1.375 0.563v3.875h-5.656c-0.563 0-1.063 0.469-1.063 1.031z"></path>
                </svg>
              </span>
              <p className="leading-1 ml-4 flex font-medium text-gray-600 hidden lg:block">
                Logout
              </p>
            </li>
          </div>
        </a>
      </ul>
    </div>
  );
}

export default SideBar;
