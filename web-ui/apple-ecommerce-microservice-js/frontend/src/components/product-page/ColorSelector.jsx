import React from "react";

function ColorSelector({ sameNameProducts, selectedColor, handleColorSelect, product }) {
    const colorMap = {
        trắng: "#ffffff",
        đen: "#000000",
        đỏ: "#ff0000",
        "xanh dương": "#0000ff",
        "xanh lá": "#00ff00",
        vàng: "#ffff00",
        hồng: "#ff69b4",
        tím: "#800080",
        bạc: "#c0c0c0",
        xám: "#808080",
        cam: "#ffa500",
        nâu: "#a52a2a",
        "xanh lá cây": "#228b22",
        "xanh navy": "#000080",
        "xanh mint": "#98fb98",
        "vàng gold": "#ffd700",
    };

    if (!sameNameProducts || sameNameProducts.length <= 1) {
        return null;
    }

    return (
        <div className="mb-6">
            <label className="block text-lg font-medium mb-2">Chọn màu sắc:</label>
            <div className="flex gap-3 flex-wrap">
                {sameNameProducts.map((item) => {
                    const colorHex = colorMap[item.color?.toLowerCase()] || item.colorCode || "#ccc";
                    const isSelected = selectedColor === item.color;
                    
                    return (
                        <div key={item._id} className="flex flex-col items-center">
                            <button
                                title={item.color}
                                onClick={() => {
                                    handleColorSelect(item);
                                }}
                                className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                                    isSelected 
                                        ? "border-blue-600 scale-110 ring-2 ring-blue-200" 
                                        : "border-gray-400"
                                } ${colorHex === "#ffffff" ? "border-gray-400" : ""}`}
                                style={{ backgroundColor: colorHex }}
                            />
                            <span className="text-xs mt-1 text-gray-600">{item.color}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ColorSelector;