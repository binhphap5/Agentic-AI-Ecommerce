import React, { useState, useEffect } from "react";
import SideBar from "./SideBar/SideBar";
import HeaderAdmin from "./HeaderAdmin/HeaderAdmin";
import TableProducts from "./Table/TableProducts";

export default function Product() {
  const [productData, setProductData] = useState([]); // State to store the fetched products
  const [loading, setLoading] = useState(true); // State to track loading state
  const [error, setError] = useState(null); // State to handle errors

  // Fetch data from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/perfumes`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProductData(data); // Update the state with fetched data
      } catch (error) {
        setError(error.message); // Set error state if fetch fails
      } finally {
        setLoading(false); // Set loading state to false once fetch is done
      }
    };

    fetchProducts();
  }, []); // Empty dependency array ensures this runs only once when the component mounts


  if (loading) {
    return <div>Loading...</div>; // Display loading text while fetching data
  }

  if (error) {
    return <div>Error: {error}</div>; // Display error message if there's an error
  }

  return (
    <div className="bg-[#f5f8fe]">
      <div className="h-full w-full flex">
        <SideBar />

        <main className="flex-1 w-[80%] h-full transition-all ml-[16%]">
          <div className="h-full">
            <HeaderAdmin title="Quản lí sản phẩm" />
            <div className="pt-5 mx-auto mb-auto h-full min-h-[84vh] md:pr-2">
              {/* Pass handleAddProduct as onAdd prop */}
              <TableProducts productData={productData}/>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
