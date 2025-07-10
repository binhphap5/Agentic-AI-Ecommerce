import React, { useState, useEffect } from "react";
import Card from "../card/index";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper();

function TableUsers(props) {
  const { tableData} = props; // onEdit and onDelete passed as props
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const columns = [
    columnHelper.accessor("fullName", {
      id: "fullName",
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-black">Full Name</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-black">{info.getValue()}</p>,
    }),
    columnHelper.accessor("phone", {
      id: "phone",
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-black">Phone</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-black">{info.getValue()}</p>,
    }),
    columnHelper.accessor("email", {
      id: "email",
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-black">Email</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-black">{info.getValue()}</p>,
    }),
    columnHelper.accessor("address", {
      id: "address",
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-black">Address</p>,
      cell: (info) => <p className="text-sm font-bold text-navy-700 dark:text-black">{info.getValue()}</p>,
    }),
    columnHelper.accessor("id", {
      id: "actions",
      header: () => <p className="text-sm font-bold text-gray-600 dark:text-black">Actions</p>,
      cell: (info) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(info.row.original)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(info.row.original)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleLoadMore = () => {
    setPageCount((prevPageCount) => prevPageCount + 1);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
  
    if (currentUser) {
      console.log('Saving user data:', currentUser); // Log the data
  
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/update-user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentUser), // Ensure this is the correct object
        });
  
        if (!response.ok) {
          throw new Error('Failed to update user');
        } else {
          toast.success('Cập nhật người dùng thành công!', {
            position: 'top-right',
            autoClose: 2000,
          });
  
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
  
        closeModal();
      } catch (error) {
        console.error('Error updating user:', error);
      }
    } else {
      console.error('Current user is null');
    }
  };
  

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/delete-user`, {
          method: 'DELETE', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userToDelete),
        });
  
        if (!response.ok) {
          throw new Error('Failed to delete user');
        } else{
          toast.success("Xóa users thành công!", {
            position: "top-right",
            autoClose: 2000,
          });
  
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
  
        
  
        setIsDeleteModalOpen(false); 
        setUserToDelete(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  return (
    <Card extra={"w-full pb-10 p-4 h-full mt-4"}>
      <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="!border-px !border-gray-400">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer border-b-[1px] border-gray-200 pt-4 pb-2 pr-4 text-start"
                  >
                    <div className="items-center justify-between text-xs text-black-200">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (header.column.getIsSorted() === "asc" ? "↑" : "↓") : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table
              .getRowModel()
              .rows.slice(0, pageCount * ITEMS_PER_PAGE)
              .map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="min-w-[150px] border-white/0 py-3 pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {tableData.length > pageCount * ITEMS_PER_PAGE && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Load More
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && currentUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4">Edit User</h3>
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={currentUser.fullName}
                onChange={(e) => setCurrentUser({ ...currentUser, fullName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1 mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={currentUser.phone}
                onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1 mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1 mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                value={currentUser.address}
                onChange={(e) => setCurrentUser({ ...currentUser, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1 mb-4"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-black rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-1/3">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p>Are you sure you want to delete this user?</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-black rounded-md"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )} 

    </Card>
  );
}

export default TableUsers;
