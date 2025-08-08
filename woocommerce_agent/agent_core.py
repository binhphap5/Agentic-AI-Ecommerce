from langchain_openai import ChatOpenAI
from langgraph.prebuilt.chat_agent_executor import AgentState
from typing import Optional
from utils.prompts import system_prompt
from tools import tools
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.base import BaseCheckpointSaver
from dotenv import load_dotenv
import os
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.runnables import RunnableConfig

load_dotenv()
# Get model configuration for LangChain
def get_langchain_model():
    llm = os.getenv('LLM_CHOICE', 'gpt-4o-mini')
    base_url = os.getenv('LLM_BASE_URL', 'http://localhost:11434/v1')
    api_key = os.getenv('LLM_API_KEY', 'ollama')
    # Enable streaming for the model
    return ChatOpenAI(model=llm,
                      base_url=base_url,
                      api_key=api_key,
                      streaming=True)

llm = get_langchain_model()

class CustomAgentState(AgentState):
    userID: Optional[str]
    
checkpointer = InMemorySaver()

# --- Custom Agent Implementation (Async) ---

# 1. Define the tools
all_tools = [*tools]
tool_executor = ToolNode(all_tools)

llm_with_tools = llm.bind_tools(all_tools)

# 3. Define the agent node as an async function
async def run_agent(state: CustomAgentState, config: RunnableConfig):
    """
    Invokes the agent runnable asynchronously with the correct input.
    """
    # always include the system prompt in the messages
    all_messages = [system_prompt] + state["messages"]
    response = await llm_with_tools.ainvoke(all_messages, config)
    return {"messages": [response]}

# 4. Define the custom tool node as an async function
async def custom_tool_node(state: CustomAgentState):
    """
    This node executes tools asynchronously and injects userID into 'order_tool' calls.
    """
    last_message = state["messages"][-1]
    tool_calls = last_message.tool_calls

    # Custom logic to inject userID
    for tool_call in tool_calls:
        if tool_call['name'] == "order_tool":
            user_id = state.get("userID")
            if user_id:
                tool_call['args']["userID"] = user_id
                print(f"Successfully injected userID '{user_id}' into order_tool arguments.")
            else:
                print("Warning: userID not found in state for order_tool call.")
    
    # Invoke the tool executor asynchronously
    return await tool_executor.ainvoke(state)

# 5. Assemble the graph
graph_builder = StateGraph(CustomAgentState)

graph_builder.add_node("agent", run_agent)
graph_builder.add_node("tools", custom_tool_node)

graph_builder.set_entry_point("agent")

graph_builder.add_conditional_edges(
    "agent",
    tools_condition,
    {"tools": "tools", "__end__": "__end__"}
)
graph_builder.add_edge("tools", "agent")

# Compile the graph
agent_graph = graph_builder.compile(checkpointer=checkpointer)

# The clear_memory function remains the same
def clear_memory(memory: BaseCheckpointSaver, thread_id: str) -> None:
    """ Clear the memory for a given thread_id. """
    try:
        if hasattr(memory, 'storage') and hasattr(memory, 'writes'):
            memory.storage.pop(thread_id, None)
            keys_to_remove = [key for key in memory.writes.keys() if key[0] == thread_id]
            for key in keys_to_remove:
                memory.writes.pop(key, None)
            print(f"Memory cleared for thread_id: {thread_id}")
            return
    except Exception as e:
        print(f"Error clearing InMemorySaver storage for thread_id {thread_id}: {e}")
