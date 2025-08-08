from mcp.server.fastmcp import FastMCP
# import getdotenv
from dotenv import load_dotenv
import os
import requests
from tavily import TavilyClient
from typing import Optional, Literal
from langchain_huggingface import HuggingFaceEmbeddings
import torch
from sentence_transformers import CrossEncoder
from retriever.retrieval import query_supabase_with_llm, get_product_semantic_with_reranker

load_dotenv()

# Load embedding model
embedding_model = HuggingFaceEmbeddings(
    model_name="Alibaba-NLP/gte-multilingual-base",
    model_kwargs={
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "trust_remote_code": True,
    },
)

# Load reranking model
reranker_model = CrossEncoder("Alibaba-NLP/gte-multilingual-reranker-base",
                              trust_remote_code=True,
                              device="cuda" if torch.cuda.is_available() else "cpu")

# Create an MCP server
mcp = FastMCP("LKN Privé", port=8001)

# Tool implementation

# @mcp.tool()
# async def tavily_web_search(query: str) -> str:
#     """
#     Perform a web search.

#     Args:
#         query (str): The search query string.

#     Returns:
#         str: The search result from Tavily API. If the API key is not set, 
#         returns an error message prompting to set TAVILY_API_KEY.
#     """

#     api_key = os.getenv("TAVILY_API_KEY")

#     if not api_key:
#         return "Tavily API key not set. Please set TAVILY_API_KEY in your environment."
#     client = TavilyClient(api_key=api_key)

#     response = client.search(query, limit=2, search_depth="advanced", include_answer=True)

#     return response

@mcp.tool()
def get_product_semantic_tool(query: str) -> str:
    """
    Sử dụng khi cần truy vấn thông tin về mặt ngữ nghĩa.

    Tham số:
        query (str): Câu hỏi tiếng Việt từ người dùng đã được chuẩn hóa cho truy vấn ngữ nghĩa.

    Trả về:
        str: Kết quả trả về là thông tin các sản phẩm dựa trên câu hỏi.
    """

    return get_product_semantic_with_reranker(query, embedding_model=embedding_model, reranker_model=reranker_model)

@mcp.tool()
def query_supabase_tool(query: str) -> str:
    """
    Sử dụng khi cần truy vấn thông tin chính xác từ cơ sở dữ liệu.

    Tham số:
        query (str): Câu hỏi tiếng Việt từ người dùng đã được chuẩn hóa cho truy vấn SQL.

    Trả về:
        str: Kết quả trả về là thông tin các sản phẩm dựa trên câu hỏi.
    """
    return query_supabase_with_llm(query, embedding_model=embedding_model, reranker_model=reranker_model)

@mcp.tool()
def order_tool(
    product_ids: list[str],
    address: str,
    paymentMethod: Literal["COD", "Momo"],
    userID: Optional[str] = None
) -> str:
    """
    Tạo và xác nhận một đơn hàng dựa trên danh sách ID các sản phẩm.

    Tham số:
        product_ids (list[str]): Danh sách ID các sản phẩm (có thể trùng nếu số lượng lớn hơn 1).
        address (str): Địa chỉ giao hàng của người dùng.
        paymentMethod (Literal["COD", "Momo"]): Phương thức thanh toán,

    Trả về:
        str: Kết quả trả về là thông tin các sản phẩm và trạng thái của đơn hàng.
    """

    if not userID:
        return "Người dùng cần đăng nhập để đặt hàng."

    if not product_ids:
        return "Vui lòng cung cấp danh sách ID sản phẩm."
    
    # Xử lý danh sách ID sản phẩm để tính toán quantity
    product_count = {}
    for pid in product_ids:
        if pid in product_count:
            product_count[pid] += 1
        else:
            product_count[pid] = 1

    # --- Bước 1: Lấy thông tin sản phẩm ---
    try:
        product_url = os.getenv("PRODUCT_SERVICE_URL") + "/get-by-ids"
        product_response = requests.post(product_url, json={"product_ids": list(product_count.keys())})

        if product_response.status_code != 200:
            return f"Lỗi khi lấy thông tin sản phẩm: {product_response.status_code} - {product_response.text}"

        products = product_response.json()
        if not products:
            return "Không tìm thấy sản phẩm nào với các ID đã cho. Hãy dùng tool query_database_tool để lấy thông tin ID trước."

    except requests.exceptions.RequestException as e:
        return f"Đã xảy ra lỗi khi kết nối tới dịch vụ sản phẩm: {e}"

    # --- Bước 2: Tạo đơn hàng tạm thời ---
    order_id = None
    total_amount = sum(p.get("price", 0) * product_count.get(p.get("product_id"), 0) for p in products)
    
    if paymentMethod == "Momo" and total_amount > 50000000:
        return (
            "Yêu cầu bị từ chối. " 
            "Số tiền tối đa cho phép là 50000000 VND. "
            f"Đơn của bạn có giá trị lên tới {total_amount} VND."
        )
    
    try:
        user_id = userID
        items = [{"productId": p.get("product_id"), "quantity": product_count.get(p.get("product_id"), 1)} for p in products]

        order_payload = {
            "items": items,
            "totalAmount": total_amount,
            "paymentMethod": paymentMethod,
            "address": address,
        }

        order_url = os.getenv("ORDER_SERVICE_URL")
        order_url = f"{order_url}/{user_id}"
        order_response = requests.post(order_url, json=order_payload)

        if order_response.status_code != 201:
            return f"Lỗi khi tạo đơn hàng tạm: {order_response.status_code} - {order_response.text}"

        order_data = order_response.json()
        order_id = order_data.get("_id")

    except requests.exceptions.RequestException as e:
        return f"Đã xảy ra lỗi khi kết nối tới dịch vụ đặt hàng: {e}"

    # --- Bước 3: Xác nhận đơn hàng ---
    if not order_id:
        return "Không thể xác nhận đơn hàng vì không lấy được ID đơn hàng tạm."

    try:
        update_url = os.getenv("ORDER_SERVICE_URL") + f"/{order_id}/status"
        momo_service_url = os.getenv("PAYMENT_SERVICE_URL") + f"/qr/{order_id}"

        is_Momo = paymentMethod == "Momo"

        if is_Momo:
            momo_payload = {
                "amount": order_data.get("totalAmount", 0),
                "userID": userID,
            }
            momo_response = requests.post(momo_service_url, json=momo_payload)

            if momo_response.status_code != 200:
                return f"Lỗi khi thanh toán bằng Momo: {momo_response.status_code} - {momo_response.text}"

            # Lấy link thanh toán Momo
            payment_link = momo_response.json().get("payUrl", "")
            
        update_payload = {
            "isTemporary": True if is_Momo else False,
            "status": "Đã xác nhận",
            "paymentStatus": "Unpaid",
            "paymentMethod": paymentMethod,
        }

        update_response = requests.put(update_url, json=update_payload)

        if update_response.status_code != 200:
            return f"Lỗi khi xác nhận đơn hàng: {update_response.status_code} - {update_response.text}"

        # Format thông tin trả về
        product_info = [
            f"- {p.get('name', 'N/A')} - {p.get('storage', 'N/A')} GB (Giá: {p.get('price', 'N/A')} VNĐ) (Màu sắc: {p.get('color', 'N/A')}) - Số lượng: {product_count.get(p.get('product_id'), 1)}"
            for p in products
        ]
        response_message = (
            "Đơn hàng:\n"
            + "\n".join(product_info)
            + f"\n\nTổng cộng: {total_amount} VNĐ."
            + f"\nGiao tới: {address}."
            + f"\nXem chi tiết đơn hàng tại 'Trang cá nhân'."
        )

        if is_Momo:
            response_message += f"\n\nBẮT BUỘC gửi link thanh toán sau cho user: {payment_link}"
            response_message += f"\nĐơn hàng sẽ bị hủy sau 5 phút nếu không thanh toán."
        return response_message

    except requests.exceptions.RequestException as e:
        return f"Đã xảy ra lỗi khi kết nối tới dịch vụ đặt hàng để cập nhật: {e}"

    
# Run the server
if __name__ == "__main__":
    mcp.run(transport='streamable-http')