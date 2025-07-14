# retrieval.py
from dotenv import load_dotenv

import os
import sys
current_dir = os.path.dirname(__file__) # Lấy đường dẫn của file hiện tại
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(os.path.join(parent_dir, 'utils'))

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
    llm = 'gpt-4.1-nano'
    base_url = 'https://api.openai.com/v1'
    api_key = os.getenv('OPENAI_API_KEY')
    return ChatOpenAI(model=llm, base_url=base_url, api_key=api_key, disable_streaming=True)

llm_small = get_langchain_model()

sql_chain: Runnable = sql_prompt | llm_small

# Supabase client setup
client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# ==== SEMANTIC TOOL ====

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
    return vs.as_retriever(search_type="similarity_score_threshold", search_kwargs={"k": 3, 'score_threshold': 0.7})

def get_product_semantic(query: str, embedding_model=None) -> str:
    """
    Truy xuất thông tin ngữ nghĩa của sản phẩm dựa trên truy vấn.

    Tham số:
        query (str): Câu truy vấn để tìm các sản phẩm liên quan.
        embedding_model: Một instance của HuggingFaceEmbeddings.

    Trả về:
        str: Chuỗi đã được định dạng tóm tắt tổng số sản phẩm tìm thấy 
        và chi tiết metadata của chúng.
    """
    if embedding_model is None:
        embedding_model = HuggingFaceEmbeddings(
            model_name="Alibaba-NLP/gte-multilingual-base",
            model_kwargs={
                'device': 'cuda' if torch.cuda.is_available() else 'cpu',
                'trust_remote_code': True
            }
        )

    retriever = get_vector_retriever(embedding_model)
    docs_res = retriever.invoke(query)
    total_docs = len(docs_res)
    output = f"TÌM THẤY TỔNG CỘNG {total_docs} SẢN PHẨM"

    # Theo dõi sản phẩm đã hiển thị description/evaluate
    shown_names = set()

    for idx, doc in enumerate(docs_res):
        metadata = doc.metadata
        name = metadata.get("name", f"SẢN PHẨM {idx+1}")

        output += f"\n\nSẢN PHẨM {idx+1}: {name}"

        for key, value in metadata.items():
            # Bỏ qua description & evaluate nếu đã show cùng tên
            if key in ["description", "evaluate"] and name in shown_names:
                continue
            output += f"\n- {key}: {value}"

        shown_names.add(name)

    return output

# ==== QUERY SUPABASE TOOL ====
def query_supabase_with_llm(user_query: str, embedding_model=None) -> str:
    """
    Nhận một câu tiếng Việt từ người dùng, sinh ra một hoặc nhiều SQL queries,
    thực thi tuần tự từng truy vấn và fallback sang semantic nếu không có kết quả.
    Tránh lặp lại description/evaluate nếu các sản phẩm có cùng name.
    """
    try:
        # 1. Gọi LLM nhỏ để sinh SQL
        sql_output = sql_chain.invoke({"user_query": user_query})
        raw_sql = sql_output.content.strip()
        print(f"Generated SQL:\n{raw_sql}")

        # 2. Tách từng câu SQL riêng
        sql_statements = [stmt.strip() for stmt in raw_sql.split(";") if stmt.strip()]
        if not sql_statements:
            return "Không tạo được truy vấn SQL phù hợp."

        final_output = ""
        found_any_result = False
        shown_names = set()  # Lưu các tên sản phẩm đã hiển thị đầy đủ

        for idx, sql_query in enumerate(sql_statements):
            if "limit" not in sql_query.lower():
                sql_query += " LIMIT 3"

            wrapped_query = f"SELECT to_jsonb(t) FROM ({sql_query}) AS t;"
            response = client.postgrest.rpc('execute_sql', {"sql": wrapped_query}).execute()
            data = response.data

            if getattr(response, "error", None) is None and data:
                found_any_result = True
                final_output += f"\nKẾT QUẢ TRUY VẤN {idx + 1}:\n"

                for i, row in enumerate(data):
                    item = row
                    if not item:
                        final_output += f"\nSẢN PHẨM {i + 1}: (Không có dữ liệu)\n"
                        continue

                    name = item.get("name", f"SẢN PHẨM {i + 1}")
                    final_output += f"\nSẢN PHẨM {i + 1}: {name}"

                    for key, value in item.items():
                        # Tránh lặp lại description/evaluate nếu đã show cho name này
                        if key in ["description", "evaluate"] and name in shown_names:
                            continue
                        final_output += f"\n- {key}: {value}"
                    
                    shown_names.add(name)

            else:
                final_output += f"\nKẾT QUẢ TRUY VẤN {idx + 1}: Không tìm thấy kết quả phù hợp.\n"

        # 3. Fallback nếu không có kết quả nào
        if not found_any_result:
            return get_product_semantic(user_query, embedding_model)

        return final_output.strip()

    except Exception as e:
        return f"Lỗi hệ thống: {str(e)}"


    
if __name__ == "__main__":
    # Test the function
    test_query = "Tìm iPhone RAM 8GB giá dưới 10 triệu"
    result = query_supabase_with_llm(test_query)
    print(result)