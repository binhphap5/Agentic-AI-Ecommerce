import React, { useState } from "react";

const Notifications = ({ notifications }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;

  // Calculate the indices for the notifications to display
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirstNotification, indexOfLastNotification);

  // Change page function
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  return (
    <div className="mb-6">
      <div className="bg-white shadow-lg p-4 rounded-lg">
        <h2 className="text-xl font-bold">Notifications</h2>
        <ul className="space-y-2">
          {currentNotifications.map((notification, index) => (
            <li key={index} className="bg-gray-100 p-2 rounded-lg">
              {notification}
            </li>
          ))}
        </ul>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {[...Array(totalPages).keys()].map((page) => (
              <button
                key={page + 1}
                onClick={() => paginate(page + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === page + 1
                    ? "bg-blue-500 text-black"
                    : "bg-gray-200 text-black"
                }`}
              >
                {page + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
