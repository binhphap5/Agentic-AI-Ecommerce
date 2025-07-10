import React from 'react';
import BarChart from './BarChart'; // Import the reusable BarChart component

const AdvancedDashboard = ({ monthlyRevenueData }) => {
  const data = {
    labels: monthlyRevenueData.map((entry) => entry.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyRevenueData.map((entry) => entry.revenue),
        backgroundColor: '#4CAF50', // Use a green color for the revenue bars
        borderColor: '#388E3C',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-5 bg-white mt-5 mb-5">
      <h2 className="text-2xl font-bold mb-4">Revenue in the Last 12 Months</h2>
      <BarChart data={data} title="Revenue by Month" />
    </div>
  );
};

export default AdvancedDashboard;
