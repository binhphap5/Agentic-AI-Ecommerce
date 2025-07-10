import React from "react";

function CardAnalysis({ title, value, icon, color }) {
  return (
    <div className="!z-5 relative flex flex-col rounded-[20px] bg-white bg-clip-border shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:text-black dark:shadow-none !flex-row flex-grow items-center rounded-[20px]">
      <div className="ml-[18px] flex h-[90px] w-auto flex-row items-center">
        <div className={`rounded-full ${color} p-3 dark:bg-navy-700`}>
          <span className="flex items-center text-brand-500 dark:text-black ">
            {icon}
          </span>
        </div>
      </div>
      <div className="h-50 ml-4 flex w-auto flex-col justify-center">
        <p className="font-dm text-sm font-medium text-gray-600">{title}</p>
        <h4 className="text-xl font-bold text-navy-700 dark:text-black">{value}</h4>
      </div>
    </div>
  );
}

export default CardAnalysis;
