import React, { useState } from "react";
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

function TableProducts(props) {
  const { productData} = props; // Nhận data sản phẩm và các hàm onEdit, onDelete, onAdd từ props
  const [sorting, setSorting] = React.useState([]);

  // State cho modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // State for Add Product modal
  const [currentProduct, setCurrentProduct] = useState(null); // Sản phẩm hiện tại
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    image: '',
    variants: [],
    category: 'For Her',
    description: '',
  });
  
  // Pagination state
  const [pageCount, setPageCount] = useState(1);
  const ITEMS_PER_PAGE = 20; // Số lượng sản phẩm hiển thị mỗi lần

  const columns = [
    columnHelper.accessor("image", {
      id: "image",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-black">Hình ảnh</p>
      ),
      cell: (info) => (
        <img src={info.getValue()} alt="Product" className="w-20 h-20 object-cover" />
      ),
    }),
    columnHelper.accessor("name", {
      id: "name",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-black">Tên sản phẩm</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-black">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("quantity", {
      id: "quantity",
      header: () => (
        <p className="text-sm text-gray-600 dark:text-black">Số lượng tồn</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-black">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("variants", {
      id: "variants",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-black">Giá bán</p>
      ),
      cell: (info) => (
        <div className="text-sm text-navy-700 dark:text-black">
          {info.getValue().map((variant, index) => (
            <div key={index}>
              {variant.size}-{variant.price.toLocaleString()}đ
            </div>
          ))}
        </div>
      ),
    }),
    columnHelper.accessor("category", {
      id: "category",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-black">Loại</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-black">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("id", {
      id: "actions",
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-black"></p>
      ),
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
    data: productData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault(); 
  
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/perfumes/update-product`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentProduct), // Gửi sản phẩm đã chỉnh sửa
      });
  
      if (response.ok) {
        setIsEditModalOpen(false); // Đóng modal

        const updatedProduct = await response.json();
        toast.success("Cập nhật thành công!", {
          position: "top-right",
          autoClose: 2000,
        });

        // Navigate after success
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } else {
        const errorData = await response.json();
        toast.error(`Lỗi: ${errorData.message || 'Không thể cập nhật sản phẩm.'}`, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Có lỗi xảy ra khi cập nhật sản phẩm. Vui lòng thử lại.', { position: 'top-right' });
    }
  };
  

  const handleDelete = (product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/perfumes/delete-product`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: currentProduct.id}),
      });
  
      if (response.ok) {
        setIsDeleteModalOpen(false);
        toast.success("Xóa sản phẩm thành công!", {
          position: "top-right",
          autoClose: 2000,
        });

        // Navigate after success
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(`Lỗi: ${errorData.message || 'Không thể xóa sản phẩm.'}`, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.', { position: 'top-right' });
    }
  };
  

  const handleLoadMore = () => {
    setPageCount((prevPageCount) => prevPageCount + 1);
  };

  const getPaginatedData = () => {
    const startIndex = (pageCount - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return productData.slice(0, endIndex);
  };


  const uploadImage = async (imageFile) => {
    try {
      const data = new FormData();
      data.append('image', imageFile);
  
      const imageUploadResponse = await fetch(
        'https://api.imgbb.com/1/upload?key=db96fd24d507bc171c6696ffb0bc1f6f',
        { method: 'POST', body: data }
      );
  
      const imageUploadData = await imageUploadResponse.json();
  
      if (imageUploadData.success) {
        return imageUploadData.data.url; // Return the uploaded image URL
      } else {
        console.error('Image upload failed:', imageUploadData);
        toast.error('Tải ảnh lên thất bại, vui lòng thử lại.', { position: 'top-right' });
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Có lỗi xảy ra khi tải ảnh lên, vui lòng thử lại.', { position: 'top-right' });
      return null;
    }
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadedImageUrl = await uploadImage(file);
      if (uploadedImageUrl) {
        setNewProduct({
          ...newProduct,
          image: uploadedImageUrl, // Store the uploaded image URL
        });
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();  // Ngăn chặn hành động mặc định của form
  
  
    try {
      // Gửi yêu cầu POST đến backend để thêm sản phẩm
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/perfumes/add-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name : newProduct.name, 
          quantity: newProduct.quantity,
          image: newProduct.image,
          variants: newProduct.variants,
          category: newProduct.category,
          description: newProduct.description
        }), // Gửi dữ liệu sản phẩm dưới dạng JSON
      });
  
      if (response.ok) {
        setIsAddModalOpen(false); // Đóng modal
        const result = await response.json();
        toast.success("Thêm sản phẩm thành công!", {
          position: "top-right",
          autoClose: 2000,
        });

        // Navigate after success
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(`Lỗi: ${errorData.message || 'Không thể thêm sản phẩm.'}`, { position: 'top-right' });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.', { position: 'top-right' });
    } finally {
      setNewProduct({ name: '', quantity: 0, image: "", variants: [], category: "", description: "" }); // Reset form sau khi thêm sản phẩm
    }
  };
  
  
  

  return (
    <div className="mt-5">
  <Card extra={"w-full pb-10 p-4 h-full"}>
    {/* Add Product Button */}
    <div className="flex justify-end mb-4">
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Add Product
      </button>
    </div>

    <div className="mt-8 overflow-x-auto xl:overflow-x-hidden">
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
                  <div className="items-center justify-between text-xs text-black">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted()
                      ? header.column.getIsSorted() === "asc"
                        ? "↑"
                        : "↓"
                      : null}
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
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {/* Load More Button */}
    {productData.length > pageCount * ITEMS_PER_PAGE && (
      <div className="flex justify-center mt-4">
        <button
          onClick={handleLoadMore}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Load More
        </button>
      </div>
    )}
  </Card>

  {isEditModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md sm:w-96">
      <h3 className="text-xl font-semibold mb-4">Edit Product</h3>
      <form onSubmit={(e) => handleSaveEdit(e)}>
        {/* Image */}
        <div>
          <label>Hình ảnh:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Name */}
        <div>
          <label>Tên sản phẩm:</label>
          <input
            type="text"
            value={currentProduct?.name || ""}
            onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Quantity */}
        <div>
          <label>Số lượng tồn:</label>
          <input
            type="number"
            value={currentProduct?.quantity || 0}
            onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: parseInt(e.target.value) })}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Variants */}
        <div>
          <label>Giá bán (Size - Giá):</label>
          <div>
            {currentProduct?.variants?.map((variant, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => {
                    const updatedVariants = [...currentProduct.variants];
                    updatedVariants[index].size = e.target.value;
                    setCurrentProduct({ ...currentProduct, variants: updatedVariants });
                  }}
                  placeholder="Size"
                  className="w-1/4 p-2 border rounded"
                />
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => {
                    const updatedVariants = [...currentProduct.variants];
                    updatedVariants[index].price = parseFloat(e.target.value);
                    setCurrentProduct({ ...currentProduct, variants: updatedVariants });
                  }}
                  placeholder="Price"
                  className="w-1/4 p-2 border rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label>Loại:</label>
          <select
            value={currentProduct?.category || ""}
            onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
            className="w-full p-2 border rounded mt-1"
          >
            <option value="For Her">For Her</option>
            <option value="For Him">For Him</option>
            <option value="Unisex">Unisex</option>
            <option value="Body Mist">Body Mist</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label>Mô tả sản phẩm:</label>
          <textarea
            value={currentProduct?.description || ""}
            onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            rows="4"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 bg-gray-300 mr-2"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}


  {isDeleteModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md sm:w-96">
        <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
        <p>Bạn có chắc chắn muốn xóa sản phẩm này?</p>
        <div className="flex justify-end mt-4">
          <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-300 mr-2">No</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  )}


{isAddModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md sm:w-96">
      <h3 className="text-xl font-semibold mb-4">Thêm mới sản phẩm</h3>

      {/* Form */}
      <form onSubmit={handleAddProduct}>
        {/* Image selection */}
        <div>
          <label>Hình ảnh:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        {/* Product name */}
        <div>
          <label>Tên sản phẩm:</label>
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label>Số lượng tồn:</label>
          <input
            type="number"
            value={newProduct.quantity}
            min="0"
            onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) })}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>

        {/* Price (size - price) */}
        <div>
          <label>Giá bán (Size - Giá):</label>
          <div>
            {newProduct.variants.map((variant, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => {
                    const updatedVariants = [...newProduct.variants];
                    updatedVariants[index].size = e.target.value;
                    setNewProduct({ ...newProduct, variants: updatedVariants });
                  }}
                  placeholder="Size"
                  className="w-1/4 p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => {
                    const updatedVariants = [...newProduct.variants];
                    updatedVariants[index].price = parseFloat(e.target.value);
                    setNewProduct({ ...newProduct, variants: updatedVariants });
                  }}
                  placeholder="Price"
                  className="w-1/4 p-2 border rounded"
                  required
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setNewProduct({
                  ...newProduct,
                  variants: [...newProduct.variants, { size: "", price: 0 }],
                })
              }
              className="mt-2 px-4 py-2 text-black rounded"
            >
              Add Variant
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label>Loại:</label>
          <select
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            required
          >
            <option value="For Her">For Her</option>
            <option value="For Him">For Him</option>
            <option value="Unisex">Unisex</option>
            <option value="Body Mist">Body Mist</option>
          </select>
        </div>

        {/* Product Description */}
        <div>
          <label>Mô tả sản phẩm:</label>
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            rows="4"
            placeholder="Enter product description"
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(false)}
            className="px-4 py-2 bg-gray-300 mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  </div>
)}
 
</div>

  );
}

export default TableProducts;
