import React, { useState, useEffect } from "react";
import SideBar from "./SideBar/SideBar";
import HeaderAdmin from "./HeaderAdmin/HeaderAdmin";
import TableUsers from "./Table/TableUsers";

export default function Account() {
  const [tableData, setUserData] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/get-all-users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUserData(data.users); // Đặt dữ liệu người dùng vào state
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="bg-[#f5f8fe]">
      <div className="h-full w-full flex">
        <SideBar />
        <main className="flex-1 w-[80%] h-full transition-all ml-[16%]">
          <div className="h-full">
            <HeaderAdmin title="Quản lí tài khoản" />
            <div className="pt-5 mx-auto mb-auto h-full min-h-[84vh] md:pr-2">
              <TableUsers tableData={tableData} /> {/* Truyền dữ liệu userData */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
