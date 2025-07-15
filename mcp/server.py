from mcp.server.fastmcp import FastMCP
# import getdotenv
from dotenv import load_dotenv
import os
import requests
from requests.auth import HTTPBasicAuth
import re
import unicodedata
from urllib.parse import unquote 
from tavily import TavilyClient

load_dotenv()

# Create an MCP server
mcp = FastMCP("Muse", port=8001)

# Tool implementation
@mcp.tool()
async def tavily_web_search(query: str) -> str:
    """
    Perform a web search.

    Args:
        query (str): The search query string.

    Returns:
        str: The search result from Tavily API. If the API key is not set, 
        returns an error message prompting to set TAVILY_API_KEY.
    """

    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key:
        return "Tavily API key not set. Please set TAVILY_API_KEY in your environment."
    client = TavilyClient(api_key=api_key)

    response = client.search(query, limit=2, search_depth="advanced", include_answer=True)

    return response


# Run the server
if __name__ == "__main__":
    mcp.run(transport='streamable-http')