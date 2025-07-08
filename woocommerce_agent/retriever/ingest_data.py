import pandas as pd
import numpy as np
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client
import os
from dotenv import load_dotenv

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """Tiền xử lý dữ liệu để tối ưu hóa cho vector hóa"""
    # Chuẩn hóa dữ liệu số và categorical
    df['price'] = df['price'].astype(float)
    df['ram'] = df['ram'].fillna('').apply(lambda x: str(x).replace('GB', '').strip().replace(' ', ''))
    df['storage'] = df['storage'].fillna('').apply(lambda x: str(x).replace('TB', '000GB').replace('GB', '').strip().replace(' ', ''))
    
    # Xử lý giá trị thiếu
    text_columns = ['name', 'type', 'description', 'evaluate', 'color']
    for col in text_columns:
        df[col] = df[col].fillna('')
    
    # Chuẩn hóa đánh giá
    df['evaluate'] = df['evaluate'].apply(lambda x: f"{x}/5" if isinstance(x, (int, float)) else x)
    
    return df

def generate_product_content(row: pd.Series) -> str:
    """Tạo nội dung semantic-rich cho embedding từ các trường sản phẩm"""
    features = [
        f"**Sản phẩm**: {row['name']}",
        f"**Loại**: {row['type']}",
        f"**Cấu hình**: RAM {row['ram']}GB - Bộ nhớ {row['storage']}GB",
        f"**Giá**: {row['price']:,.0f} VNĐ",
        f"**Mô tả**: {row['description'][:500]}",  # Giới hạn độ dài
        f"**Đánh giá**: {row['evaluate']}",
        f"**Màu sắc**: {row['color']}"
    ]
    return "\n".join(features)

def load_to_supabase(excel_path: str):
    # Đọc và tiền xử lý dữ liệu
    df = pd.read_excel(excel_path)
    df = preprocess_data(df)
    
    docs = []
    for _, row in df.iterrows():
        # Tạo nội dung semantic cho embedding
        content = generate_product_content(row)
        
        # Tạo metadata với các trường filterable
        metadata = {
            "product_id": str(row["product_id"]),
            "name": row["name"],
            "type": row["type"],
            "ram": int(row["ram"]) if row["ram"] and row["ram"].isdigit() else 0,
            "storage": int(row["storage"]) if row["storage"] and row["storage"].isdigit() else 0,
            "price": float(row["price"]),
            "stock": row["stock"],
            "color": row["color"],
            "image": row["image"]
        }
        
        docs.append(Document(page_content=content, metadata=metadata))

    # Kết nối Supabase
    load_dotenv()
    client = create_client(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_key=os.getenv("SUPABASE_SERVICE_KEY")
    )

    # Khởi tạo embedding model (tối ưu cho tiếng Việt)
    embed = HuggingFaceEmbeddings(
        model_name="Alibaba-NLP/gte-multilingual-base",
        model_kwargs={'device':'cuda', 'trust_remote_code': True}
    )

    # Tải dữ liệu lên Supabase
    vector_store = SupabaseVectorStore.from_documents(
        documents=docs,
        embedding=embed,
        client=client,
        table_name="products",
        query_name="match_documents"
    )
    
    print(f"[SUCCESS] Đã nạp {len(docs)} sản phẩm lên Supabase")
    print(f"[NOTE] Kích thước vector: {len(embed.embed_query('test'))} chiều")

if __name__ == "__main__":
    load_to_supabase("meta_data_phone.xlsx")

