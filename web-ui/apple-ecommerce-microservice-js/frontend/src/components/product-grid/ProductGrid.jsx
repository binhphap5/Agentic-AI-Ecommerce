import React, { useState, useEffect } from "react";
import ProductSorting from "./ProductSorting";
import ProductFiltering from "./ProductFiltering";
import AddToCartButton from "./AddToCartButton";
import ProductCounter from "./ProductCounter";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const ITEMS_PER_PAGE = 12;
const INITIAL_PAGE_COUNT = 1;

function ProductGrid({ category }) {
    const [products, setProducts] = useState([]);
    const [sortedProducts, setSortedProducts] = useState({});
    const [filteredProducts, setFilteredProducts] = useState({});
    const [pageCount, setPageCount] = useState(INITIAL_PAGE_COUNT);
    const [productData, setProductData] = useState({
        products: [],
        isDataLoaded: false,
    });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/get`);
                const data = await response.json();
                setProductData({ products: data, isDataLoaded: true });
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        validate();
    }, [sortedProducts, filteredProducts, productData]);

    const getCategoryProducts = () => {
        if (!category) return productData.products;
        return productData.products.filter((product) => product.type === category);
    };

    const validate = () => {
        if (sortedProducts.isSorted && !filteredProducts.isFiltered) {
            return setProducts(sortedProducts.products);
        }

        if (filteredProducts.isFiltered && !sortedProducts.isSorted) {
            return setProducts(filteredProducts.products);
        }

        if (sortedProducts.isSorted && filteredProducts.isFiltered) {
            return setProducts(
                sortedProducts.products.filter((product) =>
                    filteredProducts.products.some((filteredProduct) => filteredProduct._id === product._id)
                )
            );
        }

        return setProducts(getCategoryProducts());
    };

    const handleLoadMore = () => {
        setPageCount((prev) => prev + 1);
    };

    const getPaginatedData = () => {
        const start = (pageCount - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return products.slice(0, end);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    return (
        <div className="max-w-screen-2xl mx-auto p-9 flex flex-col md:flex-col lg:flex-row">
            <div className="flex flex-col relative lg:mr-8 mb-5 lg:mb-0">
                <ProductFiltering
                    products={getCategoryProducts()}
                    setFilteredProducts={setFilteredProducts}
                />
            </div>

            <div className="flex flex-col w-full">
                <div className="flex justify-end sm:justify-between items-center text-sm mb-2">
                    <div className="hidden sm:block">
                        <ProductCounter total={products.length} />
                    </div>
                    <ProductSorting products={getCategoryProducts()} setSortedProducts={setSortedProducts} />
                </div>

                <div className="min-h-[80%]">
                    {getPaginatedData().length > 0 ? (
                        <ul className="mt-2 mb-12 product-list grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {getPaginatedData().map((product) => (
                                <li key={product._id} className="flex flex-col product-item justify-between items-center bg-white shadow-md rounded-lg">
                                    <a href={`products/${product._id}`} className="hover:underline flex flex-col items-center">
                                        <LazyLoadImage
                                            effect="blur"
                                            src={product.image}
                                            alt={product.description}
                                            className="w-full h-auto aspect-[1/1] max-w-[100%] mx-auto"
                                        />
                                        <span className="text-base text-center mt-2">{product.name}</span>
                                    </a>

                                    <span className="text-lg">{formatPrice(product.price)}</span>

                                    <AddToCartButton product={product} selectedSize={product.storage} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-center py-20">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/7486/7486790.png"
                                alt="No Products"
                                className="w-20 h-20 mb-4 opacity-60"
                            />
                            <p className="text-gray-500 text-lg">Không có sản phẩm phù hợp</p>
                            </div>
                        )}
                    
                </div>

                <div className="flex justify-center mx-auto">
                    <div className="d-grid text-center">
                        <div className="text-sm p-6">
                            <ProductCounter count={getPaginatedData().length} total={products.length} />
                        </div>

                        {products.length > pageCount * ITEMS_PER_PAGE && (
                            <button onClick={handleLoadMore} className="text-black border bg-white font-normal py-2 px-8 mb-8">
                                Load More
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductGrid;
