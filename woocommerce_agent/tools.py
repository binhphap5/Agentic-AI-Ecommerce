from langchain_huggingface import HuggingFaceEmbeddings
import torch
from retriever.retrieval import query_supabase_with_llm, get_product_semantic
from langchain_mcp_adapters.client import MultiServerMCPClient
import asyncio
from typing import List, Dict, Any, Annotated, Optional, Literal
from langgraph.prebuilt import InjectedState
import requests

# Load embedding model
embedding_model = HuggingFaceEmbeddings(
    model_name="Alibaba-NLP/gte-multilingual-base",
    model_kwargs={'device':'cuda' if torch.cuda.is_available() else 'cpu',
                  'trust_remote_code': True}
)

# Load MCP tools

# async def get_mcp_tools():
#     client = MultiServerMCPClient(
#         {
#             # "math":{
#             #     "command":"python",
#             #     "args":["first_server.py"], ## Ensure correct absolute path
#             #     "transport":"stdio",
#             # },
#             "LKN_Prive": {
#                 "url": "http://localhost:8001/mcp",  # Ensure server is running here
#                 "transport": "streamable_http",
#             }
#         }
#     )

#     tools = await client.get_tools()
#     return tools

# tools = asyncio.run(get_mcp_tools())

# Define tools
def get_product_semantic_tool(query: str) -> str:
    """
    Trả về chuỗi thông tin ngữ nghĩa của các sản phẩm dựa trên một truy vấn.

    Tham số:
        query (str): Câu hỏi tiếng Việt từ người dùng đã được chuẩn hóa cho truy vấn.

    Trả về:
        str: Kết quả trả về là thông tin các sản phẩm dựa trên câu hỏi.
    """

    return get_product_semantic(query, embedding_model=embedding_model)

def query_supabase_tool(query: str) -> str:
    """
    Nhận một câu tiếng Việt từ người dùng và trả về kết quả truy vấn từ Supabase.

    Tham số:
        query (str): Câu hỏi tiếng Việt từ người dùng đã được chuẩn hóa cho truy vấn.

    Trả về:
        str: Kết quả trả về là thông tin các sản phẩm dựa trên câu hỏi.
    """
    return query_supabase_with_llm(query, embedding_model=embedding_model)

def order_tool(product_ids: list[str], address: str, paymentMethod: Literal["COD", "Momo"],
               userID: Annotated[Optional[str], InjectedState("userID")]) -> str:
    """
    Tạo và xác nhận một đơn hàng dựa trên danh sách ID sản phẩm.
    Công cụ sẽ lấy thông tin sản phẩm, tạo đơn hàng tạm, sau đó xác nhận đơn hàng đó.

    Tham số:
        product_ids (list[str]): Danh sách ID sản phẩm cần đặt hàng.
    
    Trả về:
        str: Kết quả trả về là thông tin các sản phẩm và trạng thái đơn hàng đã xác nhận.
    """
    
    if not userID:
        return "Người dùng cần đăng nhập để đặt hàng."

    if not product_ids:
        return "Vui lòng cung cấp danh sách ID sản phẩm."

    # --- Bước 1: Lấy thông tin sản phẩm ---
    try:
        product_url = "http://localhost/api/products/get-by-ids"
        product_response = requests.post(product_url, json={"product_ids": product_ids})
        
        if product_response.status_code != 200:
            return f"Lỗi khi lấy thông tin sản phẩm: {product_response.status_code} - {product_response.text}"
            
        products = product_response.json()
        if not products:
            return "Không tìm thấy sản phẩm nào với các ID đã cho. Hãy dùng tool query_database_tool để lấy thông tin ID trước."

    except requests.exceptions.RequestException as e:
        return f"Đã xảy ra lỗi khi kết nối tới dịch vụ sản phẩm: {e}"

    # --- Bước 2: Tạo đơn hàng tạm thời ---
    order_id = None
    total_amount = sum(p.get("price", 0) for p in products)
    try:
        user_id = userID 
        items = [{"productId": p.get("product_id"), "quantity": 1} for p in products]

        order_payload = {
            "items": items,
            "totalAmount": total_amount,
            "paymentMethod": paymentMethod,
            "address": address
        }

        order_url = f"http://localhost/api/orders/{user_id}"
        order_response = requests.post(order_url, json=order_payload)

        if order_response.status_code != 201:
            return f"Lỗi khi tạo đơn hàng tạm: {order_response.status_code} - {order_response.text}"
        
        order_data = order_response.json()
        order_id = order_data.get('_id')

    except requests.exceptions.RequestException as e:
        return f"Đã xảy ra lỗi khi kết nối tới dịch vụ đặt hàng: {e}"

    # --- Bước 3: Xác nhận đơn hàng ---
    if not order_id:
        return "Không thể xác nhận đơn hàng vì không lấy được ID đơn hàng tạm."

    try:
        update_url = f"http://localhost/api/orders/{order_id}/status"
        
        payment_status = "Paid" if paymentMethod == "Momo" else "Unpaid"

        update_payload = {
            "isTemporary": False,
            "status": "Confirm",
            "paymentStatus": payment_status,
            "paymentMethod": paymentMethod,
        }

        update_response = requests.put(update_url, json=update_payload)

        if update_response.status_code != 200:
            return f"Lỗi khi xác nhận đơn hàng: {update_response.status_code} - {update_response.text}"

        # Format thông tin trả về
        product_info = [f"- {p.get('name', 'N/A')} - {p.get('storage', 'N/A')} GB (Giá: {p.get('price', 'N/A')} VND) (Màu sắc: {p.get('color', 'N/A')})" for p in products]
        
        response_message = (
            "Đơn hàng của bạn:\n"
            + "\n".join(product_info)
            + f"\n\nTổng cộng: {total_amount} VND."
            + f"\nMã đơn hàng của bạn là: {order_id}."
            + f"\nTrạng thái thanh toán: {payment_status}."
        )
        return response_message

    except requests.exceptions.RequestException as e:
        return f"Đã xảy ra lỗi khi kết nối tới dịch vụ đặt hàng để cập nhật: {e}"
