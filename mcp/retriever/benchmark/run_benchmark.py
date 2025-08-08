
import sys
import os
import json
from pathlib import Path
import logging
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# --- Add parent directory to sys.path to import retrieval functions ---
current_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
sys.path.append(os.path.join(parent_dir, "..", "utils"))

from retrieval import get_product_semantic_retriever_only, get_product_semantic_with_reranker
from beir import util
from beir.datasets.data_loader import GenericDataLoader
from beir.retrieval.evaluation import EvaluateRetrieval
from beir.retrieval.search.base import BaseSearch
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder
import torch

# --- Constants ---
DATA_DIR = Path(__file__).parent / "test_data_llm"
EMBEDDING_MODEL_NAME = "Alibaba-NLP/gte-multilingual-base"
RERANKER_MODEL_NAME = "Alibaba-NLP/gte-multilingual-reranker-base"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def plot_benchmark_results(results: dict, output_path: str):
    """Generates and saves a bar chart comparing benchmark results."""
    logging.info(f"Generating benchmark plot to {output_path}...")
    
    data_for_plotting = []
    model_name_map = {
        "retriever_only": "Retriever Only",
        "retriever_reranker": "Retriever + Reranker"
    }

    for model_key, metrics in results.items():
        model_display_name = model_name_map.get(model_key, model_key)
        for metric_name, k_scores in metrics.items():
            for k_value_str, score in k_scores.items():
                try:
                    k = k_value_str.split('@')[1]
                    data_for_plotting.append({
                        "Model": model_display_name,
                        "Metric": f"{metric_name}@k",
                        "K": f"@{k}",
                        "Score": score
                    })
                except (IndexError, ValueError):
                    logging.warning(f"Could not parse k-value from '{k_value_str}'. Skipping.")
    
    if not data_for_plotting:
        logging.error("No data available for plotting.")
        return

    df = pd.DataFrame(data_for_plotting)

    sns.set_theme(style="whitegrid")
    g = sns.catplot(
        data=df, x="K", y="Score", hue="Model", col="Metric",
        kind="bar", height=5, aspect=1.1, palette="viridis",
        col_wrap=2, sharey=False, legend_out=True
    )

    for ax in g.axes.flat:
        for p in ax.patches:
            if p.get_height() == 0:
                continue
            ax.annotate(f'{p.get_height():.3f}',
                        (p.get_x() + p.get_width() / 2., p.get_height()),
                        ha='center', va='center', fontsize=12,
                        xytext=(0, 9), textcoords='offset points')

        ax.set_title(ax.get_title().split('=')[1].strip(), fontsize=14, fontweight='bold', pad=20)

    g.fig.suptitle("Benchmark: Retriever vs. Retriever+Reranker", fontsize=18, y=1.03)
    g.set_axis_labels("Top K", "Score")
    
    model_info = f"Retriever Model: {EMBEDDING_MODEL_NAME}\nReranker Model: {RERANKER_MODEL_NAME}"
    plt.figtext(0.5, -0.02, model_info, ha="center", fontsize=15)

    plt.tight_layout(rect=[0, 0.03, 1, 0.97])
    g.legend.set_bbox_to_anchor((1.05, 0.5))
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    logging.info("Benchmark plot saved successfully.")


def create_unique_title_from_product(product: dict) -> str:
    """Helper function to create the unique title for matching."""
    name = product.get('name', '')
    storage_val = str(product.get('storage', ''))
    storage_normalized = storage_val.upper().replace("GB", "").strip()
    color = product.get('color', '')
    return f"{name} | {storage_normalized} | {color}"

class RetrieverOnlySearch(BaseSearch):
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
        self.results = {}
    def search(self, corpus, queries, top_k, *args, **kwargs):
        title_to_doc_id_map = {doc.get("title"): doc_id for doc_id, doc in corpus.items()}
        for q_id, query_text in queries.items():
            response_json = get_product_semantic_retriever_only(query_text, self.embedding_model)
            products = json.loads(response_json).get("products", [])
            scores = {}
            for i, product in enumerate(products[:top_k]):
                unique_title = create_unique_title_from_product(product)
                doc_id = title_to_doc_id_map.get(unique_title)
                if doc_id:
                    scores[doc_id] = 1.0 / (i + 1)
            self.results[q_id] = scores
        return self.results
    def encode(self, sentences, **kwargs): pass
    def search_from_files(self, corpus_file, queries_file, top_k, **kwargs): pass

class RerankerSearch(BaseSearch):
    def __init__(self, embedding_model, reranker_model):
        self.embedding_model = embedding_model
        self.reranker_model = reranker_model
        self.results = {}
    def search(self, corpus, queries, top_k, *args, **kwargs):
        title_to_doc_id_map = {doc.get("title"): doc_id for doc_id, doc in corpus.items()}
        for q_id, query_text in queries.items():
            response_json = get_product_semantic_with_reranker(query_text, self.embedding_model, self.reranker_model, is_log=False, is_test=True)
            products = json.loads(response_json).get("products", [])
            scores = {}
            for i, product in enumerate(products[:top_k]):
                unique_title = create_unique_title_from_product(product)
                doc_id = title_to_doc_id_map.get(unique_title)
                if doc_id:
                    scores[doc_id] = 1.0 / (i + 1)
            self.results[q_id] = scores
        return self.results
    def encode(self, sentences, **kwargs): pass
    def search_from_files(self, corpus_file, queries_file, top_k, **kwargs): pass

def main():
    """Main function to run the benchmark and generate plot."""
    logging.info("Starting benchmark process with LLM-generated data...")
    if not DATA_DIR.exists():
        logging.error(f"Data directory not found: {DATA_DIR}. Please run 'generate_test_data_llm.py' first.")
        return
        
    corpus, queries, qrels = GenericDataLoader(data_folder=DATA_DIR).load(split="test")
    embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME, model_kwargs={"device": DEVICE, "trust_remote_code": True})
    reranker_model = CrossEncoder(RERANKER_MODEL_NAME, trust_remote_code=True, device=DEVICE)

    models_to_benchmark = {
        "retriever_only": RetrieverOnlySearch(embedding_model),
        "retriever_reranker": RerankerSearch(embedding_model, reranker_model),
    }

    all_results = {}
    for model_name, model in models_to_benchmark.items():
        logging.info(f"\n===== Benchmarking: {model_name} =====")
        retriever = EvaluateRetrieval(model, score_function="dot")
        results = retriever.retrieve(corpus, queries)
        
        logging.info("Evaluating results...")
        k_values = [1, 3, 5]
        ndcg, _map, recall, precision = retriever.evaluate(qrels, results, k_values)
        
        all_results[model_name] = {"NDCG": ndcg, "MAP": _map, "Recall": recall, "Precision": precision}
        
        print(f"\n--- Results for {model_name} ---")
        print(f"NDCG@k: {json.dumps(ndcg, indent=2)}")
        print(f"MAP@k: {json.dumps(_map, indent=2)}")
        print(f"Recall@k: {json.dumps(recall, indent=2)}")
        print(f"Precision@k: {json.dumps(precision, indent=2)}")
        print("-----------------------------------\n")

    # After running all benchmarks, generate the plot
    plot_benchmark_results(all_results, os.path.join(os.path.dirname(__file__), "benchmark_results.png"))
    logging.info("Benchmark finished.")

if __name__ == "__main__":
    main()
