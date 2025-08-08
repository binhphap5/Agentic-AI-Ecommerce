
import pandas as pd
import json
import os
import sys
import random
import logging
from dotenv import load_dotenv

# --- Setup logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Add parent directory to sys.path to import LLM setup ---
current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
sys.path.append(os.path.join(parent_dir, "..", "utils"))

# Now we can import the LLM setup from the existing retrieval script
try:
    from retrieval import get_langchain_model
except ImportError as e:
    logging.error(f"Could not import 'get_langchain_model'. Make sure retriever/retrieval.py is accessible. Error: {e}")
    sys.exit(1)

load_dotenv()

# --- Constants ---
TOTAL_PRODUCTS = 100
PRODUCT_DISTRIBUTION = {
    "iPhone": 0.33,
    "iPad": 0.33,
    "MacBook": 0.34
}
QUERIES_PER_PRODUCT = 3 # Number of queries to generate per product
OUTPUT_DIR = os.path.join(current_dir, 'test_data_llm')

# --- Prompt Template for LLM ---
GENERATION_PROMPT = """
Bạn là một khách hàng đang tìm mua các sản phẩm công nghệ của Apple.
Dựa trên thông tin chi tiết của sản phẩm dưới đây, hãy tạo ra {num_queries} câu truy vấn tìm kiếm đa dạng mà một người dùng thực tế có thể gõ vào thanh tìm kiếm.

**Yêu cầu về câu truy vấn:**
1.  **Đa dạng:** Bao gồm câu hỏi trực tiếp, câu có lỗi chính tả/viết tắt, câu hỏi so sánh, và câu hỏi dựa trên nhu cầu.
2.  **Ngôn ngữ:** Sử dụng tiếng Việt tự nhiên.
3.  **Format:** Chỉ trả về một danh sách JSON chứa các chuỗi truy vấn, không có bất kỳ giải thích hay văn bản nào khác. Ví dụ: ["câu truy vấn 1", "câu truy vấn 2"]

**Thông tin sản phẩm:**
- **Tên:** {name}
- **Loại:** {type}
- **Ram:** {ram} GB
- **Dung lượng:** {storage} GB
- **Màu sắc:** {color}
- **Giá:** {price} VNĐ
- **Mô tả:** {description}

Hãy tạo ra các câu truy vấn cho sản phẩm này.
"""

def filter_and_sample_products(df: pd.DataFrame) -> pd.DataFrame:
    """Filters products by type and samples them according to the defined distribution."""
    logging.info("Filtering and sampling products...")
    
    df['type'] = df['type'].str.strip()
    
    sampled_dfs = []
    for prod_type, fraction in PRODUCT_DISTRIBUTION.items():
        num_samples = int(TOTAL_PRODUCTS * fraction)
        
        type_df = df[df['type'].str.contains(prod_type, case=False, na=False)]
        
        if len(type_df) == 0:
            logging.warning(f"No products found for type: {prod_type}. Skipping.")
            continue
            
        if len(type_df) < num_samples:
            logging.warning(f"Not enough products for type {prod_type}. Taking all {len(type_df)} available products.")
            num_samples = len(type_df)
            
        sampled_dfs.append(type_df.sample(n=num_samples, random_state=42))
        
    if not sampled_dfs:
        logging.error("No products could be sampled. Please check the 'type' column in your Excel file.")
        return pd.DataFrame()

    final_df = pd.concat(sampled_dfs).reset_index(drop=True)
    logging.info(f"Successfully sampled {len(final_df)} products.")
    return final_df

def generate_queries_with_llm(llm, product_info: dict) -> list[str]:
    """Generates search queries for a product using an LLM."""
    prompt_text = GENERATION_PROMPT.format(
        num_queries=QUERIES_PER_PRODUCT,
        name=product_info.get('name', 'N/A'),
        type=product_info.get('type', 'N/A'),
        ram=product_info.get('ram', 'N/A'),
        storage=product_info.get('storage', 'N/A'),
        color=product_info.get('color', 'N/A'),
        price=product_info.get('price', 'N/A'),
        description=product_info.get('description', 'N/A')
    )
    
    try:
        response = llm.invoke(prompt_text)
        # The response content should be a JSON string list
        queries = json.loads(response.content)
        if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
            return queries
        else:
            logging.warning(f"LLM output was not a list of strings: {queries}")
            return []
    except (json.JSONDecodeError, TypeError) as e:
        logging.error(f"Failed to parse LLM response for product {product_info.get('name')}. Error: {e}")
        logging.error(f"Raw response: {response.content}")
        return []

def main():
    """Main function to generate and save the LLM-based test data."""
    logging.info("Starting LLM-based test data generation process...")
    
    # --- Load source data ---
    csv_path = os.path.join(parent_dir, 'meta_data_phone.csv')
    try:
        df = pd.read_csv(csv_path)
        df.fillna('N/A', inplace=True)
    except FileNotFoundError:
        logging.error(f"Error: The file was not found at {csv_path}")
        return

    # --- Filter and Sample ---
    sampled_df = filter_and_sample_products(df)
    if sampled_df.empty:
        return

    # --- Initialize LLM ---
    logging.info("Initializing LLM...")
    llm = get_langchain_model()

    # --- Generate Data ---
    corpus = {}
    queries = {}
    qrels = []
    query_id_counter = 0

    logging.info(f"Generating queries for {len(sampled_df)} products...")
    for i, row in sampled_df.iterrows():
        # Create unique ID and title
        doc_id = f"doc_{i}"
        storage_normalized = str(row.get('storage', '')).upper().replace("GB", "").strip()
        unique_title = f"{row.get('name', '')} | {storage_normalized} | {row.get('color', '')}"
        
        # Add to corpus
        corpus[doc_id] = {
            "title": unique_title,
            "text": json.dumps(row.to_dict(), ensure_ascii=False) # Store full info as text
        }
        
        # Generate queries for this product
        generated_queries = generate_queries_with_llm(llm, row.to_dict())
        
        if not generated_queries:
            logging.warning(f"No queries generated for {unique_title}. Skipping.")
            continue

        for query_text in generated_queries:
            query_id = f"q_{query_id_counter}"
            queries[query_id] = query_text
            qrels.append({"query-id": query_id, "corpus-id": doc_id, "score": 1})
            query_id_counter += 1
    
    logging.info(f"Generated a total of {len(queries)} queries.")

    # --- Save Files ---
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Save Corpus
    corpus_path = os.path.join(OUTPUT_DIR, 'corpus.jsonl')
    with open(corpus_path, 'w', encoding='utf-8') as f:
        for doc_id, content in corpus.items():
            f.write(json.dumps({"_id": doc_id, "title": content["title"], "text": content["text"]}, ensure_ascii=False) + '\n')
    logging.info(f"Corpus saved to {corpus_path}")

    # Save Queries
    queries_path = os.path.join(OUTPUT_DIR, 'queries.jsonl')
    with open(queries_path, 'w', encoding='utf-8') as f:
        for query_id, text in queries.items():
            f.write(json.dumps({"_id": query_id, "text": text}, ensure_ascii=False) + '\n')
    logging.info(f"Queries saved to {queries_path}")

    # Save Qrels
    qrels_dir = os.path.join(OUTPUT_DIR, 'qrels')
    os.makedirs(qrels_dir, exist_ok=True)
    qrels_path = os.path.join(qrels_dir, 'test.tsv')
    pd.DataFrame(qrels).to_csv(qrels_path, sep='\t', index=False, header=True)
    logging.info(f"Qrels saved to {qrels_path}")
    
    logging.info("\nLLM-based test data generation complete!")


if __name__ == "__main__":
    main()
