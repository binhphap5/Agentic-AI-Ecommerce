function TotalPrice({ cartItems, selectedItems }) {
    const selectedCart = cartItems.filter(item => selectedItems.includes(item._id));

    const totalPrice = selectedCart.reduce((total, item) => {
        return total + parseFloat(item.price) * parseFloat(item.quantity);
    }, 0);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="sticky bottom-0 w-full bg-white p-4 shadow-lg rounded-t-xl">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Tổng cộng:</h2>
                <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
            </div>
            {selectedCart.length === 0 && (
                <p className="mt-2 text-sm text-red-500">Vui lòng chọn sản phẩm để thanh toán</p>
            )}
        </div>
    );
}

export default TotalPrice;
