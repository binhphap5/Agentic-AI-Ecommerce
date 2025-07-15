from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.prebuilt.chat_agent_executor import AgentState
from typing import TypedDict, Optional
from utils.prompts import system_prompt
from tools import get_product_semantic_tool, query_supabase_tool, order_tool
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
    
# Use create_react_agent for a clean agent setup
agent_graph = create_react_agent(
    model=llm,
    tools=[get_product_semantic_tool, query_supabase_tool, order_tool],
    prompt=system_prompt,
    state_schema=CustomAgentState,
)
