import React, {useState, useEffect} from "react";
import SideBar from "./SideBar/SideBar";
import HeaderAdmin from "./HeaderAdmin/HeaderAdmin";
import TableOrders from "./Table/TableOrders"
export default function Order() {


  const [orderData, setOrderData] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/get-all-orders`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        console.log(data)
        setOrderData(data); // Update the state with fetched data
      } catch (error) {

      } 
    };

    fetchProducts();
  }, []); 


  
  return (
    <div className="bg-[#f5f8fe]">
      <div className="h-full w-full flex">
        <SideBar></SideBar>


        <main className="flex-1 w-[80%] h-full transition-all ml-[16%]">
          <div className="h-full ">
            <HeaderAdmin title="Quản lí đơn hàng" />
            <div className="pt-5 mx-auto mb-auto h-full min-h-[84vh] md:pr-2">
              <TableOrders orderData={orderData} />
            </div>
            
            
          </div>
        </main>
      </div>
    </div>
  );
}
