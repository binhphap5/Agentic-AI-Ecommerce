import React, { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules"; // Import Navigation module
import "swiper/css";
import "swiper/css/pagination"; // Import Swiper pagination styles
import "swiper/css/navigation"; // Import Swiper navigation styles

const CategoryDescription = ({ title, desc, carouselImages }) => {
    const swiperRef = useRef(null);

    // State to track scroll position
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        // Function to update scroll position
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        // Attach event listener to window scroll
        window.addEventListener("scroll", handleScroll);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className="relative">
            {/* Carousel Section */}
            <div className="relative h-[75vh]">
                <Swiper
                    loop={true}
                    slidesPerView={1}
                    spaceBetween={10}
                    pagination={{
                        clickable: true, // Enable clickable pagination dots
                    }}
                    // navigation={{
                    //     prevEl: ".swiper-button-prev", // Link to the custom prev button
                    //     nextEl: ".swiper-button-next", // Link to the custom next button
                    // }} // Enable navigation and link to custom buttons
                    modules={[Pagination, Navigation]} // Register both Pagination and Navigation modules
                    className="w-full h-full" // Full width and height
                    ref={swiperRef} // Link the Swiper instance to the ref
                >
                    {carouselImages.map((image, index) => (
                        <SwiperSlide key={index}>
                            <img
                                src={image}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-cover object-center" // Full width and height, cover image
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Text Section - Fixed position with scroll effect */}
                <div
                    className="absolute bottom-0 left-0 w-1/2 h-1/3 flex items-center justify-start z-10 bg-black bg-opacity-0 "
                    style={{
                        position: "fixed", // Fix the text section in place
                        top: "50%", // Position at the center of the screen
                        transform: "translateY(-50%)", // Vertically center the text
                        opacity: 1 - scrollY / 500, // Fade out as user scrolls down
                        pointerEvents: "none", // Prevent the text from blocking interactions
                    }}
                >
                    <div className="text-left text-gray p-6 mx-auto">
                        <h1 className="text-3xl md:text-5xl font-bold font-light mb-2">{title}</h1>
                        <p className="text-md md:text-lg font-light">{desc}</p>
                    </div>
                </div>
            </div>

            {/* Custom Navigation Buttons
            <div className="absolute top-1/2 left-4 z-20 transform -translate-y-1/2">
                <button className="swiper-button-prev text-black p-2 rounded-full">
                    Prev
                </button>
            </div>
            <div className="absolute top-1/2 right-4 z-20 transform -translate-y-1/2">
                <button className="swiper-button-next text-black p-2 rounded-full">
                    Next
                </button>
            </div> */}
        </div>
    );
};

export default CategoryDescription;
