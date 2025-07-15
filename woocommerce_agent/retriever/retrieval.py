# retrieval.py
import json
from dotenv import load_dotenv

import os
import sys

current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(os.path.join(parent_dir, "utils"))

from supabase.client import create_client

from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from langchain_huggingface import HuggingFaceEmbeddings

import torch

from prompts import sql_gen_prompt

load_dotenv()

# Small SQL LLM (4.1-nano)
sql_prompt = PromptTemplate.from_template(sql_gen_prompt)


def get_langchain_model():
    llm = "gpt-4.1-nano"
    base_url = "https://api.openai.com/v1"
    api_key = os.getenv("OPENAI_API_KEY")
    return ChatOpenAI(
        model=llm, base_url=base_url, api_key=api_key, disable_streaming=True
    )


llm_small = get_langchain_model()

sql_chain: Runnable = sql_prompt | llm_small

# Supabase client setup
client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))


def _deduplicate_by_name(products: list[dict]) -> list[dict]:
    """Removes duplicate description/evaluate for products with the same name."""
    seen_names = set()
    deduplicated = []
    for product in products:
        name = product.get("name")
        if name in seen_names:
            product.pop("description", None)
            product.pop("evaluate", None)
        else:
            seen_names.add(name)
        deduplicated.append(product)
    return deduplicated


# ==== SEMANTIC TOOL ====
def get_vector_retriever(embedding_model):
    vs = SupabaseVectorStore(
        client=client,
        embedding=embedding_model,
        table_name="products",
        query_name="match_documents",
    )
    return vs.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": 3, "score_threshold": 0.7},
    )


def get_product_semantic(query: str, embedding_model=None) -> str:
    if embedding_model is None:
        embedding_model = HuggingFaceEmbeddings(
            model_name="Alibaba-NLP/gte-multilingual-base",
            model_kwargs={
                "device": "cuda" if torch.cuda.is_available() else "cpu",
                "trust_remote_code": True,
            },
        )

    retriever = get_vector_retriever(embedding_model)
    docs_res = retriever.invoke(query)

    products = [doc.metadata for doc in docs_res]
    products = _deduplicate_by_name(products)
    summary = f"Tìm thấy {len(products)} sản phẩm có liên quan."

    return json.dumps({"products": products, "summary": summary})


# ==== QUERY SUPABASE TOOL ====
def query_supabase_with_llm(user_query: str, embedding_model=None) -> str:
    try:
        sql_output = sql_chain.invoke({"user_query": user_query})
        raw_sql = sql_output.content.strip()
        print(f"Generated SQL:\n{raw_sql}")

        sql_statements = [stmt.strip() for stmt in raw_sql.split(";") if stmt.strip()]
        if not sql_statements:
            return json.dumps({"products": [], "summary": "Không tạo được truy vấn SQL phù hợp."})

        all_results = []
        for sql_query in sql_statements:
            if "limit" not in sql_query.lower():
                sql_query += " LIMIT 3"

            wrapped_query = f"SELECT to_jsonb(t) FROM ({sql_query}) AS t;"
            response = client.postgrest.rpc(
                "execute_sql", {"sql": wrapped_query}
            ).execute()
            data = response.data

            if getattr(response, "error", None) is None and data:
                all_results.extend(data)

        if not all_results:
            return get_product_semantic(user_query, embedding_model)

        all_results = _deduplicate_by_name(all_results)
        summary = f"Tìm thấy {len(all_results)} sản phẩm dựa trên truy vấn của bạn."
        return json.dumps({"products": all_results, "summary": summary})

    except Exception as e:
        return json.dumps({"products": [], "summary": f"Lỗi hệ thống: {str(e)}"})
        
if __name__ == "__main__":
    # Test the function
    test_query = "Tìm iPhone RAM 8GB giá dưới 10 triệu"
    result = query_supabase_with_llm(test_query)
    print(result)