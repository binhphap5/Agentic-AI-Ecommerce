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

CONSUMER_KEY = os.getenv("CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("CONSUMER_SECRET")

# Create an MCP server
mcp = FastMCP("Muse", port=8001)

# Tool implementation
def slugify(name: str) -> str:
    """Convert product name (possibly URL encoded) to WooCommerce-style slug."""
    name = unquote(name)  # ← decode "%20" thành khoảng trắng
    name = name.replace('&', '')
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("utf-8")
    name = name.lower()
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = name.strip('-')
    return name

@mcp.tool()
async def get_product_variations(product_slug: str) -> str:
    # Step 1: Get product by slug
    """
    Retrieves product variations using a product slug.

    The function first fetches the product details based on the provided slug.
    If the product is found, it fetches the product's variations using the
    product ID. It returns a formatted list of variations with attributes
    such as price, image, permalink, and stock status, along with the product
    description.

    Args:
        product_slug (str): The slug of the product for which to retrieve variations.

    Returns:
        str: A formatted string containing details of the product variations
             or an error message if the product or its variations cannot be fetched.
    """

    url = "https://museperfume.vn/wp-json/wc/v3/products"
    product_slug = slugify(product_slug)
    params = {"slug": product_slug, "per_page": 1}
    response = requests.get(url, auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET), params=params)

    if response.status_code != 200:
        return f"Failed to fetch product. Status {response.status_code}: {response.text}"

    data = response.json()
    if not data:
        return f"No product found with slug: '{product_slug}'"

    product = data[0]
    product_id = product["id"]
    product_name = product["name"]
    product_description = product.get("description")

    # Step 2: Get variations by product ID
    variations_url = f"https://museperfume.vn/wp-json/wc/v3/products/{product_id}/variations"
    variations_response = requests.get(variations_url, auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET))

    if variations_response.status_code != 200:
        return f"Failed to fetch variations. Status {variations_response.status_code}: {variations_response.text}"

    variations = variations_response.json()
    if not variations:
        return f"No variations found for product '{product_name}'"

    # Step 3: Format variations
    variation_list = []
    for var in variations:
        variation_list.append({
            "attributes": {a["name"]: a["option"] for a in var.get("attributes", [])},
            "price": var.get("price"),
            "image": var.get("image", {}).get("src"),
            "permalink": var.get("permalink"),
            "stock_status": var.get("stock_status"),
        })

    variation_list.append("description:" + product_description)
    return variation_list

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