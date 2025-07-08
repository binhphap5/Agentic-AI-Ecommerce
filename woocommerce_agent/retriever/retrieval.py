# retrieval.py
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv
import os
from supabase.client import create_client
load_dotenv()

client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

def query_supabase(sql_query):
    """
    Execute a SQL query on Supabase using a remote procedure call, limit results and format for LLM readability.

    Args:
        sql_query (str): The SQL query to be executed.

    Returns:
        str: Formatted string of the query result for LLM consumption.
    """
    # Thêm LIMIT 10 nếu chưa có trong query
    if 'limit' not in sql_query.lower():
        if ';' in sql_query:
            sql_query = sql_query.replace(';', '')
        sql_query += ' LIMIT 3'
    response = client.postgrest.rpc('execute_sql', {"sql": sql_query}).execute()
    if getattr(response, "error", None) is None:
        data = response.data
        if not data:
            return "Không tìm thấy kết quả phù hợp."
        # Format kết quả đẹp cho LLM
        output = f"TÌM THẤY {len(data)} KẾT QUẢ:\n"
        for idx, row in enumerate(data):
            output += f"\nKẾT QUẢ {idx+1}:\n"
            for key, value in row.items():
                output += f"- {key}: {value}\n"
        return output
    else:
        return f"Lỗi truy vấn: {str(response.error)}"
import os

def get_vector_retriever(embedding_model):
    """
    Return a LangChain VectorStoreRetriever instance that can be used to retrieve
    product information from Supabase using a vector store.

    Args:
        embedding_model: An instance of HuggingFaceEmbeddings (or compatible) đã được load sẵn.

    Returns:
        langchain.VectorStoreRetriever: A VectorStoreRetriever instance that can
            be used to retrieve product information from Supabase.
    """
    vs = SupabaseVectorStore(
        client=client,
        embedding=embedding_model, 
        table_name="products",
        query_name="match_documents"
    )
    return vs.as_retriever(search_kwargs={"k":3})

def get_product_semantic(query, embedding_model):
    """
    Retrieve semantic information of products based on a query.

    Args:
        query (str): The search query to find relevant products.
        embedding_model: An instance of HuggingFaceEmbeddings.

    Returns:
        str: A formatted string summarizing the total number of products found 
        and their metadata details.
    """

    retriever = get_vector_retriever(embedding_model)
    docs_res = retriever.invoke(query)
    total_docs = len(docs_res)
    output = f"TÌM THẤY TỔNG CỘNG {total_docs} SẢN PHẨM"
    for idx, doc in enumerate(docs_res):
        output += f"\n\nSẢN PHẨM {idx+1}:\n"
        metadata_str = "\n".join(f"{key}: {value}" for key, value in doc.metadata.items())
        output += metadata_str
    return output
