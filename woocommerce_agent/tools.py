from langchain_huggingface import HuggingFaceEmbeddings
import torch
from retriever.retrieval import query_supabase, get_product_semantic
from langchain_mcp_adapters.client import MultiServerMCPClient
import asyncio

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
#             "weather": {
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
        query (str): Câu truy vấn đã được chuẩn hóa cho truy vấn.

    Trả về:
        str: Chuỗi kết quả đã được định dạng và chi tiết metadata của chúng.
    """

    return get_product_semantic(query, embedding_model=embedding_model)

def query_supabase_tool(query: str) -> str:
    """
    Thực thi một truy vấn SQL trên Supabase.

    Tham số:
        sql_query (str): Câu lệnh SQL cần thực thi.

    Trả về:
        str: Chuỗi kết quả đã được định dạng.
    """
    
    return query_supabase(query)