from langchain_mcp_adapters.client import MultiServerMCPClient
import asyncio

# Load MCP tools
async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "LKN_Privé": {
                "url": "http://localhost:8001/mcp",
                "transport": "streamable_http",
            }
        }
    )

    try:
        tools = await client.get_tools()
    except Exception:
        print("\n-----MCP Server down or not reachable-----\n")
        tools = []

    return tools

tools = asyncio.run(get_mcp_tools())




