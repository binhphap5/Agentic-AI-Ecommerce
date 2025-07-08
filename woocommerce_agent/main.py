from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from supabase import create_client, Client
from pydantic import BaseModel
from dataclasses import dataclass
from dotenv import load_dotenv
from httpx import AsyncClient
import os
import json
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient

# LangGraph and LangChain imports
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage
import torch
from retriever.retrieval import query_supabase, get_product_semantic
from langchain_community.embeddings import HuggingFaceEmbeddings
# Load environment variables
load_dotenv()

# Global HTTP client
http_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global http_client
    http_client = AsyncClient()

    yield

    # Shutdown
    await http_client.aclose()

# Initialize FastAPI app with lifespan
app = FastAPI(lifespan=lifespan)
security = HTTPBearer()

# Supabase setup
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ChatRequest(BaseModel):
    chatInput: str
    sessionId: str

class ChatResponse(BaseModel):
    output: str

# Agent dependencies
@dataclass
class AgentDeps:
    http_client: AsyncClient
    searxng_base_url: str

# LangGraph agent setup

SEARXNG_BASE_URL = os.getenv("SEARXNG_BASE_URL", "http://localhost:8081")

async def web_search_tool(query: str) -> str:
    
    """
    A simple web search tool. This tool fetches the top 3 results
    for a given query and returns a summary string with the results.

    Args:
        query (str): The search query.

    Returns:
        str: A summary string with the top 3 results.
    """
    searxng_base_url = SEARXNG_BASE_URL
    try:
        params = {'q': query, 'format': 'json'}
        response = await http_client.get(f"{searxng_base_url}/search", params=params)
        response.raise_for_status()
        data = response.json()
        results = []
        # Get top 3 results for better context
        for result in data.get('results', [])[:3]:
            title = result.get('title', '')
            url = result.get('url', '')
            snippet = result.get('content', '')
            # Try to fetch meta description if possible
            try:
                page_response = await http_client.get(url, timeout=5.0, follow_redirects=True)
                if page_response.status_code == 200:
                    # Try to extract meta description or first 500 chars of text
                    text = page_response.text
                    # Simple extraction of meta description
                    import re
                    desc_match = re.search(r'<meta name=["\']description["\'] content=["\'](.*?)["\']', text, re.IGNORECASE)
                    if desc_match:
                        snippet = desc_match.group(1)
                    else:
                        # Fallback: first 500 chars of visible text
                        snippet = text[:500]
            except Exception:
                pass
            results.append(f"- {title}\n{url}\n{snippet.strip()[:400]}\n")
        if results:
            summary = f"Kết quả tìm kiếm cho truy vấn: '{query}':\n\n" + "\n".join(results)
            return summary
        else:
            return "Không tìm thấy kết quả phù hợp."
    except Exception as e:
        return f"Đã xảy ra lỗi khi tìm kiếm web: {str(e)}"
    
# Load MCP tools
async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            # "math":{
            #     "command":"python",
            #     "args":["first_server.py"], ## Ensure correct absolute path
            #     "transport":"stdio",
            # },
            "weather": {
                "url": "http://localhost:8001/mcp",  # Ensure server is running here
                "transport": "streamable_http",
            }
        }
    )

    tools = await client.get_tools()
    return tools

embedding_model = HuggingFaceEmbeddings(
    model_name="Alibaba-NLP/gte-multilingual-base",
    model_kwargs={'device':'cuda' if torch.cuda.is_available() else 'cpu', 'trust_remote_code': True}
)

def get_product_semantic_tool(query: str) -> str:
    """
    Return a semantic information string of products based on a query.

    Args:
        query (str): The search query to find relevant products.

    Returns:
        str: A formatted string summarizing the total number of products found
             and their metadata details.
    """
    return get_product_semantic(query, embedding_model=embedding_model)

# tools = asyncio.run(get_mcp_tools())

# Get model configuration for LangChain
def get_langchain_model():
    llm = os.getenv('LLM_CHOICE', 'gpt-4.1-mini')
    base_url = os.getenv('LLM_BASE_URL', 'http://localhost:11434/v1')
    api_key = os.getenv('LLM_API_KEY', 'ollama')
    return ChatOpenAI(model=llm, base_url=base_url, api_key=api_key)

llm = get_langchain_model()

# Use create_react_agent for a clean agent setup
agent_graph = create_react_agent(
    model=llm,
    tools=[get_product_semantic_tool, query_supabase],
    prompt=(
        "SYSTEM:\n"
        "- Bạn là trợ lý bán nước hoa của cửa hàng 'Muse', chỉ nói tiếng Việt Nam.\n"
        "- Mục tiêu: tư vấn ngắn gọn, chính xác, dễ hiểu; chỉ trả lời chủ đề nước hoa.\n"
        "- Xưng hô: 'em' – 'anh/chị'.\n\n"
        "TOOL RULES (BẮT BUỘC):\n"
        "- Luôn chọn đúng công cụ phù hợp với yêu cầu của khách hàng:\n"
        "  1. Nếu khách hỏi về mô tả, cảm nhận, gợi ý nước hoa, tìm kiếm theo ý nghĩa, hoặc các câu hỏi không có điều kiện lọc rõ ràng (ví dụ: 'nước hoa nào thơm lâu', 'gợi ý nước hoa cho nam tính', 'nước hoa mùi nhẹ nhàng'), hãy dùng tool get_product_semantic_tool để tìm kiếm sản phẩm phù hợp dựa trên ý nghĩa câu hỏi.\n"
        "  2. Nếu khách hỏi về các điều kiện lọc rõ ràng dựa trên trường dữ liệu (ví dụ: 'giá dưới 2 triệu', 'sản phẩm còn hàng', 'các sản phẩm của Versace', 'các sản phẩm có dung tích 100ml', 'các sản phẩm thuộc danh mục Gift Set'), hãy dùng tool query_supabase để truy vấn trực tiếp bằng SQL.\n"
        "- Nếu không chắc, hãy ưu tiên dùng get_product_semantic_tool trước, sau đó mới dùng query_supabase nếu khách hỏi về lọc dữ liệu cụ thể.\n"
        "- Tuyệt đối không trả lời ngoài chủ đề nước hoa.\n\n"
        "THÔNG TIN BẢNG DỮ LIỆU:\n"
        "- Bảng products có trường metadata (kiểu JSONB) với cấu trúc như sau:\n"
        "  name: text\n"
        "  brand: text\n"
        "  image: text\n"
        "  price: int\n"
        "  option: text\n"
        "  permalink: text\n"
        "  categories: text\n"
        "  description: text\n"
        "  stock_status: text\n"
        "- Ví dụ một bản ghi metadata:\n"
        '{"name": "Gift Set Versace Pour Femme Dylan Blue", "brand": "Versace", "image": "https://image1.jpg", "price": 2180000, "option": "100ml", "permalink": "https://muse.vn", "categories": "Gift Set", "description": "Hương thơm mát, ...", "stock_status": "instock"}\n'
        "- Khi dùng tool query_supabase, hãy sinh truy vấn SQL phù hợp với yêu cầu lọc. Ví dụ:\n"
        "  • Để tìm sản phẩm có giá dưới 2 triệu: \n"
        "    SELECT metadata FROM products WHERE (metadata->>'price')::int < 2000000\n"
        "  • Để tìm sản phẩm của thương hiệu Versace còn hàng: \n"
        "    SELECT metadata FROM products WHERE (metadata->>'brand') = 'Versace' AND (metadata->>'stock_status') = 'instock'\n"
        "  • Để tìm sản phẩm thuộc danh mục Gift Set: \n"
        "    SELECT metadata FROM products WHERE (metadata->>'categories') ILIKE '%Gift Set%'\n\n"
        "/no_think"
    )
)


metadata_agent = create_react_agent(
    model=llm,
    tools=[],
    prompt="You are a helpful assistant."
)
# Bearer token verification
def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> bool:
    """Verify the bearer token against environment variable."""
    expected_token = os.getenv("BEARER_TOKEN")
    if not expected_token:
        raise HTTPException(
            status_code=500,
            detail="BEARER_TOKEN environment variable not set"
        )
    
    # Ensure the token is not empty or just whitespace
    expected_token = expected_token.strip()
    if not expected_token:
        raise HTTPException(
            status_code=500,
            detail="BEARER_TOKEN environment variable is empty"
        )
    
    if credentials.credentials != expected_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    return True

# Database operations
async def fetch_conversation_history(session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Fetch conversation history from Supabase."""
    try:
        response = supabase.table("n8n_chat_histories") \
            .select("*") \
            .eq("session_id", session_id) \
            .limit(limit) \
            .execute()
        
        # Reverse to get chronological order
        messages = response.data
        return messages
    except Exception as e:
        print(f"Error fetching conversation history: {e}")
        return []

import re

async def store_message(session_id: str, message_type: str, content: str, data: Optional[Dict] = None):
    """Store a message in Supabase, removing <think>...</think> blocks from content."""
    # Remove <think>...</think> blocks (including multiline)
    cleaned_content = re.sub(r'<think>.*?</think>\s*', '', content, flags=re.DOTALL | re.IGNORECASE)
    message_obj = {
        "type": message_type,
        "content": cleaned_content.strip()
    }
    if data:
        message_obj["data"] = data
    try:
        supabase.table("n8n_chat_histories").insert({
            "session_id": session_id,
            "message": message_obj
        }).execute()
    except Exception as e:
        print(f"Error storing message: {e}")

# Main endpoint
@app.post("/invoke-python-agent", response_model=ChatResponse)
async def invoke_agent(
    request: ChatRequest,
    authenticated: bool = Depends(verify_token)
):
    """Main endpoint that handles chat requests with web search capability using LangGraph agent."""
    # Check if this is a metadata request (starting with "### Task")
    if request.chatInput.startswith("### Task"):
        # For metadata requests, use the metadata agent without history
        messeges = [
            HumanMessage(content=request.chatInput)
        ]
        result = await metadata_agent.ainvoke({"messages": messeges})
        print(result["messages"][-1].content)
        return ChatResponse(output=result["messages"][-1].content)
    
    try:
        # Fetch conversation history
        history = await fetch_conversation_history(request.sessionId)
        messages = []
        for msg in history:  # Đảm bảo thứ tự từ cũ đến mới
            msg_data = msg.get("message", {})
            msg_type = msg_data.get("type")
            msg_content = msg_data.get("content", "")
            if msg_type == "human":
                messages.append(HumanMessage(content=msg_content))
            else:
                messages.append(AIMessage(content=msg_content))

        # Thêm input mới nhất của user vào messages
        messages.append(HumanMessage(content=request.chatInput))

        # Store user's message
        await store_message(
            session_id=request.sessionId,
            message_type="human",
            content=request.chatInput
        )
    
        # Run LangGraph agent
        result = await agent_graph.ainvoke(
            {"messages": messages},
        )
        output = result["messages"][-1].content
        print(output)
        
        # Store agent's response
        await store_message(
            session_id=request.sessionId,
            message_type="ai",
            content=output
        )
        
        return ChatResponse(output=output)
    except Exception as e:
        error_message = f"I encountered an error: {str(e)}"
        
        # Store error response
        await store_message(
            session_id=request.sessionId,
            message_type="ai",
            content=error_message
        )
        
        return ChatResponse(output=error_message)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8055)