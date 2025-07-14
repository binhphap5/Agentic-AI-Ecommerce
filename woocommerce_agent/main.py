from typing import List, Optional, Dict, Any, AsyncGenerator
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from supabase import create_client, Client
from pydantic import BaseModel
from dotenv import load_dotenv
from httpx import AsyncClient
import os
import json
import re

# LangGraph and LangChain imports
from langchain_core.messages import HumanMessage, AIMessage
from agent_core import agent_graph

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

# Bearer token verification is removed as per the new logic for direct integration.
# If you still need security, a different mechanism should be implemented.

# Database operations
async def fetch_conversation_history(session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Fetch conversation history from Supabase."""
    try:
        response = supabase.table("chat_histories") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .limit(limit) \
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching conversation history: {e}")
        return []

async def delete_conversation_history(session_id: str):
    """Delete all conversation history for a given session_id."""
    try:
        supabase.table("chat_histories").delete().eq("session_id", session_id).execute()
        return {"status": "success", "message": "History deleted"}
    except Exception as e:
        print(f"Error deleting conversation history: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete history")

async def store_message(session_id: str, message_type: str, content: str, data: Optional[Dict] = None):
    """Store a message in Supabase, removing <think>...</think> blocks from content."""
    cleaned_content = re.sub(r'<think>.*?</think>\s*', '', content, flags=re.DOTALL | re.IGNORECASE)
    message_obj = {"type": message_type, "content": cleaned_content.strip()}
    if data:
        message_obj["data"] = data
    try:
        supabase.table("chat_histories").insert({
            "session_id": session_id,
            "message": message_obj
        }).execute()
    except Exception as e:
        print(f"Error storing message: {e}")

# API to fetch history
@app.get("/history/{session_id}")
async def get_history(session_id: str):
    """Endpoint to fetch conversation history."""
    history = await fetch_conversation_history(session_id)
    if not history:
        return []
    # Format messages for the frontend
    formatted_messages = []
    for record in history:
        msg_data = record.get("message", {})
        formatted_messages.append({
            "from": msg_data.get("type"),
            "text": msg_data.get("content"),
            "timestamp": record.get("created_at")
        })
    return formatted_messages

# API to delete history
@app.delete("/history/{session_id}")
async def delete_history(session_id: str):
    """Endpoint to delete conversation history."""
    return await delete_conversation_history(session_id)

# Streaming endpoint
@app.post("/invoke-python-agent")
async def invoke_agent_streaming(request: ChatRequest):
    """Endpoint to handle chat requests and stream responses."""

    async def stream_generator() -> AsyncGenerator[str, None]:
        # Full conversation history to be stored at the end
        full_response = ""
        
        try:
            # Fetch conversation history
            history = await fetch_conversation_history(request.sessionId)
            messages = []
            for msg in history:
                msg_data = msg.get("message", {})
                msg_type = msg_data.get("type")
                msg_content = msg_data.get("content", "")
                if msg_type == "human":
                    messages.append(HumanMessage(content=msg_content))
                else:
                    messages.append(AIMessage(content=msg_content))

            # Add the latest user input
            messages.append(HumanMessage(content=request.chatInput))

            # Store user's message
            await store_message(
                session_id=request.sessionId,
                message_type="human",
                content=request.chatInput
            )

            # Use astream_events for streaming
            async for event in agent_graph.astream_events(
                {"messages": messages},
                version="v1" 
            ):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    if hasattr(chunk, 'content'):
                        content = chunk.content
                        if content:
                            full_response += content
                            # SSE format: data: {"chunk": "..."}


                            yield f"data: {json.dumps({'chunk': content})}\n\n"
                # You can handle other event types here if needed
                # For example, to log tool calls or other agent actions
                # elif kind == "on_tool_start":
                #     print(f"Tool start: {event['name']} with args {event['data'].get('input')}")

            # After streaming is complete, store the full AI response
            await store_message(
                session_id=request.sessionId,
                message_type="ai",
                content=full_response
            )

        except Exception as e:
            error_message = f"I encountered an error: {str(e)}"
            print(f"Error during streaming: {error_message}")
            yield f"data: {json.dumps({'error': error_message})}\n\n"
            # Store error response
            await store_message(
                session_id=request.sessionId,
                message_type="ai",
                content=error_message
            )

    return StreamingResponse(stream_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8055)