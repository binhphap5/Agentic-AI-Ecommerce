import React, { useState } from "react";
import Select from "react-select";

const ProductSorting = ({ products, setSortedProducts }) => {
    const [sortCriteria, setSortCriteria] = useState("");

    const options = [
        { value: "Featured", label: "Mặc định" },
        { value: "A-Z", label: "Tên A - Z" },
        { value: "Z-A", label: "Tên Z - A" },
        { value: "PriceAsc", label: "Giá tăng dần" },
        { value: "PriceDesc", label: "Giá giảm dần" },
    ];

    const handleSort = (selectedOption) => {
        setSortCriteria(selectedOption.value);

        const sorted = [...products]; // Clone để tránh mutate

        switch (selectedOption.value) {
            case "Featured":
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "A-Z":
                sorted.sort((a, b) => a.name?.localeCompare(b.name));
                break;
            case "Z-A":
                sorted.sort((a, b) => b.name?.localeCompare(a.name));
                break;
            case "PriceAsc":
                sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case "PriceDesc":
                sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            default:
                break;
        }

        setSortedProducts({ products: sorted, isSorted: true });
    };

    return (
        <div className="flex gap-2.5 items-center">
            <label className="flex items-center gap-2">
                <svg width="16" height="12" viewBox="0 0 16 12">
                    <path d="M11.87 3.8a2.5 2.5 0 0 1-4.74 0H1.25a.75.75 0 1 1 0-1.5H7.1a2.5 2.5 0 0 1 4.8 0h2.85a.75.75 0 0 1 0 1.5h-2.88ZM10.5 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM.5 9.05c0-.41.34-.75.75-.75H4.1a2.5 2.5 0 0 1 4.8 0h5.85a.75.75 0 0 1 0 1.5H8.87a2.5 2.5 0 0 1-4.74 0H1.25a.75.75 0 0 1-.75-.75Zm6 .95a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path>
                </svg>
                Sắp xếp theo:
            </label>
            <Select
                options={options}
                value={options.find((option) => option.value === sortCriteria)}
                onChange={handleSort}
                className="w-44"
                placeholder="Chọn..."
                isSearchable={false}
            />
        </div>
    );
};

export default ProductSorting;
