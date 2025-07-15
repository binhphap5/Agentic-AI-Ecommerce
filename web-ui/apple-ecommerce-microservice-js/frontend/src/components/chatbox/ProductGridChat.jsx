import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const ITEMS_PER_PAGE = 12;
const INITIAL_PAGE_COUNT = 1;

function ProductGridChat() {
    const { productId } = useParams();
    const [products, setProducts] = useState([]);
    const [pageCount, setPageCount] = useState(INITIAL_PAGE_COUNT);
    const [productData, setProductData] = useState({
        products: [],
        isDataLoaded: false,
    });

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;

                const productRes = await fetch(`${backendUrl}/api/products/by-product-id/${productId}`);
                const product = await productRes.json();

                if (!product || !product._id) throw new Error("Main product not found");

                const relatedRes = await fetch(`${backendUrl}/api/products/${product._id}`);
                const relatedProducts = await relatedRes.json();

                setProductData({ products: relatedProducts, isDataLoaded: true });
                setProducts(relatedProducts);
            } catch (error) {
                console.error("Error fetching related products:", error);
            }
        };

        fetchRelatedProducts();
    }, [productId]);

    const handleLoadMore = () => setPageCount((prev) => prev + 1);

    const getPaginatedData = () => {
        const start = (pageCount - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return products.slice(0, end);
    };

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);

    return (
        <div className="max-w-screen-2xl mx-auto p-9 flex flex-col md:flex-col lg:flex-row">
            <div className="flex flex-col w-full">
                <div className="min-h-[80%]">
                    {getPaginatedData().length > 0 ? (
                        <ul className="mt-2 mb-12 product-list grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {getPaginatedData().map((product) => (
                                <li
                                    key={product._id}
                                    className="flex flex-col product-item justify-between items-center bg-white shadow-md rounded-lg"
                                >
                                    <a href={`/products/${product._id}`} className="hover:underline flex flex-col items-center">
                                        <LazyLoadImage
                                            effect="blur"
                                            src={product.image}
                                            alt={product.description}
                                            className="w-full h-auto aspect-[1/1] max-w-[100%] mx-auto"
                                        />
                                        <span className="text-base text-center mt-2">{product.name}</span>
                                    </a>
                                    <span className="text-lg">{formatPrice(product.price)}</span>
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
                    {products.length > pageCount * ITEMS_PER_PAGE && (
                        <button
                            onClick={handleLoadMore}
                            className="text-black border bg-white font-normal py-2 px-8 mb-8"
                        >
                            Load More
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductGridChat;
