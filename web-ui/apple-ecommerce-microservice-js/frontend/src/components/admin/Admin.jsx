import React, { useState, useEffect } from "react";
import SideBar from "./SideBar/SideBar";
import HeaderAdmin from "./HeaderAdmin/HeaderAdmin";
import AnalyticsSession from "./Analytics/AnalyticsSession";
import AdvancedDashboard from "./Analytics/AdvancedDashboard"; // Import AdvancedDashboard
import { parseISO, startOfMonth, endOfMonth, format } from 'date-fns'; // Import date-fns functions for date manipulation

export default function Admin() {
  const [totalUsers, setTotalUsers] = useState();
  const [totalOrders, setTotalOrders] = useState();
  const [totalPerfumes, setTotalPerfumes] = useState();
  const [revenue, setRevenue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState();
  const [finishedOrders, setFinishedOrders] = useState();
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]); // State to store monthly revenue data

  //product
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/perfumes`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setTotalPerfumes(data.length); // Update the state with fetched data
      } catch (error) {
        
      } 
    };

    fetchProducts();
  }, []);

  //user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/get-all-users`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setTotalUsers(data.users.length); // Đặt dữ liệu người dùng vào state
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch order data and calculate monthly revenue
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/get-all-orders`);
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();

        const pendingCount = data.filter(order => order.status === "pending").length;
        const finishedCount = data.filter(order => order.status === "finish").length;

        const totalRevenue = data
          .filter(order => order.status === "finish")
          .reduce((acc, order) => acc + order.total, 0);

        // Calculate monthly revenue
        const revenueByMonth = data
          .filter(order => order.status === "finish")
          .reduce((acc, order) => {
            const month = startOfMonth(parseISO(order.createdAt)); // Get the start of the month
            const monthKey = format(month, 'MMM yyyy'); // Format the month key (e.g. "Jan 2024")
            if (!acc[monthKey]) {
              acc[monthKey] = 0;
            }
            acc[monthKey] += order.total; // Add the order total to the correct month
            return acc;
          }, {});

        // Convert the revenueByMonth object to an array of months and revenue
        const formattedMonthlyRevenue = Object.keys(revenueByMonth).map((month) => ({
          month,
          revenue: revenueByMonth[month],
        }));

        // Sort the data by month (optional)
        formattedMonthlyRevenue.sort((a, b) => new Date(a.month) - new Date(b.month));

        // Keep only the last 12 months
        const last12Months = formattedMonthlyRevenue.slice(-12);

        setMonthlyRevenueData(last12Months); // Set monthly revenue data

        setPendingOrders(pendingCount);
        setFinishedOrders(finishedCount);
        setRevenue(totalRevenue);
        setTotalOrders(data.length);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="bg-[#f5f8fe]">
      <div className="h-full w-full flex">
        <div className="min-w-[10px]">
          <SideBar />
        </div>

        <main className="flex-1 w-[80%] h-full transition-all ml-[16%]">
          <div className="h-full">
            <HeaderAdmin title="Main Dashboard" />
            <div className="pt-5 mx-auto mb-auto h-full min-h-[84vh] md:pr-2">
              <AnalyticsSession
                totalUsers={totalUsers}
                totalPerfumes={totalPerfumes}
                totalOrders={totalOrders}
                revenue={revenue}
                pending={pendingOrders}
                finished={finishedOrders}
              />

              {/* Pass the monthly revenue data to AdvancedDashboard */}
              <AdvancedDashboard monthlyRevenueData={monthlyRevenueData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
