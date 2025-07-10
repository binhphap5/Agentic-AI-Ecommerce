// Breadcrumb.jsx
import { Link } from "react-router-dom";

const Breadcrumb = ({ product }) => {
    return (
        <nav className="text-sm text-gray-600 mb-6">
            <ul className="flex flex-wrap items-center space-x-1">
                <li>
                    <Link to="/" className="text-orange-600 hover:underline">Trang chủ</Link>
                    <span className="mx-1">›</span>
                </li>
                <li>
                    <Link to={`/${product.type}`} className="text-orange-600 hover:underline">{product.type}</Link>
                    <span className="mx-1">›</span>
                </li>
                
                <li className="text-gray-600 font-medium underline">
                    {product?.name || "Đang tải..."}
                </li>
            </ul>
        </nav>
    );
};

export default Breadcrumb;
