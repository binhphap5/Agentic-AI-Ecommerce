from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import AgentState
from typing import TypedDict, Optional
from utils.prompts import system_prompt
from tools import get_product_semantic_tool, query_supabase_tool, order_tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.base import BaseCheckpointSaver
from dotenv import load_dotenv
import os

load_dotenv()
# Get model configuration for LangChain
def get_langchain_model():
    llm = os.getenv('LLM_CHOICE', 'gpt-4.1-mini')
    base_url = os.getenv('LLM_BASE_URL', 'http://localhost:11434/v1')
    api_key = os.getenv('LLM_API_KEY', 'ollama')
    return ChatOpenAI(model=llm, base_url=base_url, api_key=api_key)

llm = get_langchain_model()

class CustomAgentState(AgentState):
    userID: Optional[str]
    
checkpointer = InMemorySaver()

# Use create_react_agent for a clean agent setup
agent_graph = create_react_agent(
    model=llm,
    tools=[get_product_semantic_tool, query_supabase_tool, order_tool],
    prompt=system_prompt,
    state_schema=CustomAgentState,
    checkpointer=checkpointer,
    version="v2",
)
def clear_memory(memory: BaseCheckpointSaver, thread_id: str) -> None:
    """ Clear the memory for a given thread_id. """
    try:
        # If it's an InMemorySaver (which MemorySaver is an alias for),
        # we can directly clear the storage and writes
        if hasattr(memory, 'storage') and hasattr(memory, 'writes'):
            # Clear all checkpoints for this thread_id (all namespaces)
            memory.storage.pop(thread_id, None)

            # Clear all writes for this thread_id (for all namespaces)
            keys_to_remove = [key for key in memory.writes.keys() if key[0] == thread_id]
            for key in keys_to_remove:
                memory.writes.pop(key, None)

            print(f"Memory cleared for thread_id: {thread_id}")
            return

    except Exception as e:
        print(f"Error clearing InMemorySaver storage for thread_id {thread_id}: {e}")
