# Only run once to load data into Supabase

import pandas as pd
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client
import os
from dotenv import load_dotenv

def load_to_supabase(excel_path: str):
    df = pd.read_excel(excel_path).fillna('')
    docs = []
    for _, row in df.iterrows():
        content = (
            # f"Tên sản phẩm: {row['name']}. "
            # f"Thương hiệu: {row['brand']}. "
            # f"Loại: {row['categories']}. "
            # f"Tùy chọn: {row['option']}. "
            f"{row['description']}"
        )
        metadata = row.to_dict()
        docs.append(Document(page_content=content, metadata=metadata))

    load_dotenv()
    client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

    embed = HuggingFaceEmbeddings(
        model_name="Alibaba-NLP/gte-multilingual-base",
        model_kwargs={'device':'cuda', 'trust_remote_code': True}
    )

    SupabaseVectorStore.from_documents(
        documents=docs,
        embedding=embed,
        client=client,
        table_name="products",
        query_name="match_documents"
    )
    print(f"[INFO] Nạp {len(docs)} documents lên Supabase thành công.")
    
load_to_supabase("meta_data.xlsx")
