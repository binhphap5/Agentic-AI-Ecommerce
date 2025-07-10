import React from "react";
import CardAnalysis from "./CardAnalysis";

function AnalyticsSession({ totalUsers, totalPerfumes, totalOrders, revenue, pending, finished }) {
  // Format revenue
  const formattedRevenue = new Intl.NumberFormat('vi-VN').format(revenue);

  return (
    <>
      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
        <CardAnalysis
          title="Người dùng"
          value={totalUsers}
          color="bg-yellow-500"
        />
      
        <CardAnalysis
          title="Tổng cộng đơn hàng"
          value={totalOrders}
          color="bg-orange-500"
        />
        <CardAnalysis
          title="Sản phẩm"
          value={totalPerfumes}
          color="bg-pink-500"
        />
        <CardAnalysis
          title="Đơn chờ xác nhận"
          value={pending}
          color="bg-pink-500"
        />
        <CardAnalysis
          title="Đơn đã giao"
          value={finished}
          color="bg-pink-500"
        />
        <CardAnalysis
          title="Doanh thu"
          value={`${formattedRevenue}đ`}  
          color="bg-blue-500"
        />
      </div>
    </>
  );
}

export default AnalyticsSession;
