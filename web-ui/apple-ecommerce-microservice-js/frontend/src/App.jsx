import React, { useState, createContext, useEffect} from "react";
import {gapi} from 'gapi-script';
import {Route, Routes, useLocation} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css"; // Import CSS cho sticky footer
import AnnouncementBar from "./components/AnnouncementBar";
import Header from "./components/Header";
import CategoryDescription from "./components/product-grid/CategoryDescription";
import ProductGrid from "./components/product-grid/ProductGrid.jsx";
import Footer from "./components/Footer";
import Cart from "./components/cart/Cart";
import Login from "./components/login/Login"
import Register from "./components/register/Register.jsx"
import ProductPage from "./components/product-page/ProductPage";
import Profile from "./components/profile/ProfilePage.jsx"
import Recovery from "./components/login/VerifyOTP.jsx"
import CheckOut from "./components/cart/CheckOut.jsx"

import Admin from "./components/admin/Admin.jsx";
import Product from "./components/admin/Product.jsx"
import AdminLogin from "./components/admin/login/Login.jsx"
import ProtectedRoute from "./components/admin/ProtectedRoute.jsx"
import Order from "./components/admin/Order.jsx";
import Account from "./components/admin/Account.jsx";
import LoadingSpinner from "./components/common/LoadingSpinner";

import ChatBox from './components/chatbox/ChatBox';

export const Context = createContext();

const clientId = "1074315812564-92s9klc0eos45ujtefj613bkualvulq0.apps.googleusercontent.com";

function App() {
  const [cartCounter, setCartCounter] = useState(0);
  const navigationItems = ["For Him", "Unisex", "Body Mist"];
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const adminRoute = "/admin";
  const shouldHideHeaderFooter = location.pathname.includes(adminRoute);

  console.log(shouldHideHeaderFooter);

    useEffect(() => {
        function start() {
            gapi.client.init({
                clientId: clientId,
                scope: "",
            });
        }

        gapi.load("client:auth2", start);
    }, []);

   

  return (
      <Context.Provider value={[cartCounter, setCartCounter]}>
          <div className="main-content">
              {/* Announcement Bar */}
              {/* <AnnouncementBar title="Free Shipping in Europe" /> */}

              {/* Header */}
              {!shouldHideHeaderFooter && <Header navigationItems={navigationItems} />}

              {/* Routes Container */}
              <div className="routes-container">
                  <Routes>
                      <Route path="/recovery" element={<Recovery />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<CheckOut />} />
                      <Route
                          path="/"
                          element={
                              <>
                                  <CategoryDescription
                                      title=""
                                      desc=""
                                      carouselImages={[
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/banner%20iPdsr_PC%20(1).png",
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/banner%20MBsr_PC%20(1).png",
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/kv-T7_PC.png",
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/banner%20iP16sr_PC%20(1).png",
                                      ]}
                                  />
                                  <ProductGrid category="IPhone" />
                              </>
                          }
                      />
                      <Route
                          path="/IPad"
                          element={
                              <>
                                  <CategoryDescription
                                      title=""
                                      desc=""
                                      carouselImages={[
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/banner%20iPdsr_PC%20(1).png",
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/banner%20MBsr_PC%20(1).png",
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/kv-T7_PC.png",
                                        "https://shopdunk.com/images/uploaded/banner/Banner%202025/thang_7/banner%20iP16sr_PC%20(1).png",
                                      ]}
                                  />
                                  <ProductGrid category="IPad" />
                              </>
                          }
                      />
                      <Route path="/products/:id" element={<ProductPage />} />

                      {/*  admin routes */ }
                      <Route path="/admin" element={<AdminLogin />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/home" element={<ProtectedRoute element={<Admin />} />} />
                      <Route path="/admin/product" element={<ProtectedRoute element={<Product />} />} />
                      <Route path="/admin/order" element={<ProtectedRoute element={<Order />} />} />
                      <Route path="/admin/account" element={<ProtectedRoute element={<Account />} />} />
                  </Routes>
              </div>

              {/* Footer - chỉ hiển thị khi không phải admin route */}
              {!shouldHideHeaderFooter && <Footer />}
              {!shouldHideHeaderFooter && <ChatBox />}
          </div>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            />
      </Context.Provider>
  );
}

export default App;