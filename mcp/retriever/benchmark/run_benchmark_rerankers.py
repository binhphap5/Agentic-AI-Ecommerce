import sys
import os
import json
from pathlib import Path
import logging
logging.disable(logging.WARNING)

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
RERANKER_MODEL_NAMES = [
    "Alibaba-NLP/gte-multilingual-reranker-base",
    "BAAI/bge-reranker-v2-m3",
    "itdainb/PhoRanker"
]
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def plot_benchmark_results(results: dict,
                            output_path: str,
                            embedding_model_name: str = EMBEDDING_MODEL_NAME,
                            rerankers: list = RERANKER_MODEL_NAMES,
                            max_cols: int = 4):
    """
    Alternative layout with annotation placement fixed to avoid overflow.
    - Horizontal grouped bars, up to max_cols subplots per row.
    - Annotations placed inside bar if wide enough, otherwise outside.
    """
    import math
    import numpy as np
    import matplotlib.patches as mpatches
    import matplotlib.pyplot as plt   # ensure plt available
    import seaborn as sns             # ensure sns available

    # Select only rerankers that exist in results
    selected_rerankers = [r for r in rerankers if r in results]
    if not selected_rerankers:
        logging.error("No reranker results found to plot.")
        return

    # Discover all metrics across selected rerankers in stable order
    metrics = []
    for r in selected_rerankers:
        for m in results[r].keys():
            if m not in metrics:
                metrics.append(m)
    if not metrics:
        logging.error("No metrics found to plot.")
        return

    # Friendly name mapping
    short_name = {
        "Alibaba-NLP/gte-multilingual-reranker-base": "GTE-base",
        "BAAI/bge-reranker-v2-m3": "BGE-v2-m3",
        "itdainb/PhoRanker": "PhoRanker"
    }
    model_display_names = [short_name.get(r, r) for r in selected_rerankers]

    # Prepare grid layout
    n_metrics = len(metrics)
    ncols = min(max_cols, n_metrics)
    nrows = math.ceil(n_metrics / ncols)
    # Make figure a bit wider to accommodate annotations
    fig_width = max(4 * ncols, 14)
    fig_height = max(4 * nrows, 5)
    fig, axes = plt.subplots(nrows, ncols, figsize=(fig_width, fig_height), squeeze=False)

    # Use a clear palette
    palette = sns.color_palette("tab10", n_colors=len(selected_rerankers))

    # Helper: extract k labels consistently
    def extract_k_labels(metric_dict):
        kset = set()
        cleaned = {}
        for kkey, val in metric_dict.items():
            if isinstance(kkey, str):
                if "@" in kkey:
                    kstr = kkey.split("@")[-1]
                elif kkey.startswith("@"):
                    kstr = kkey[1:]
                else:
                    kstr = kkey
            else:
                kstr = str(kkey)
            klabel = f"@{kstr.strip()}"
            try:
                cleaned[klabel] = float(val)
            except Exception:
                cleaned[klabel] = 0.0
            kset.add(klabel)
        return cleaned, kset

    # Collect global K order per metric (union across models)
    metric_ks = {}
    for metric in metrics:
        k_union = set()
        per_model_clean = {}
        for r in selected_rerankers:
            mdict = results.get(r, {}).get(metric, {})
            cleaned, kset = extract_k_labels(mdict)
            per_model_clean[r] = cleaned
            k_union.update(kset)
        # sort numeric if possible
        def k_to_num(k_label):
            try:
                return int(k_label.replace("@", ""))
            except:
                try:
                    return float(k_label.replace("@", ""))
                except:
                    return 0
        k_labels = sorted(list(k_union), key=k_to_num)
        metric_ks[metric] = (k_labels, per_model_clean)

    # Draw each subplot
    for idx, metric in enumerate(metrics):
        row = idx // ncols
        col = idx % ncols
        ax = axes[row][col]

        k_labels, per_model_clean = metric_ks[metric]
        if not k_labels:
            ax.text(0.5, 0.5, f"No data for '{metric}'", ha="center")
            ax.axis('off')
            continue

        # matrix: rows = K, cols = models
        data = np.zeros((len(k_labels), len(selected_rerankers)))
        for j, r in enumerate(selected_rerankers):
            for i, k in enumerate(k_labels):
                data[i, j] = per_model_clean.get(r, {}).get(k, 0.0)

        # prepare positions for grouped horizontal bars
        y = np.arange(len(k_labels))
        total_bar_height = 0.75
        bar_height = total_bar_height / max(1, len(selected_rerankers))
        left_offset = - total_bar_height / 2.0 + bar_height / 2.0

        # determine xmax for this subplot to leave room for annotations
        xmax = max(float(data.max()), 1e-6)
        # If xmax is tiny (like <1), expand relatively; else still give margin
        ax.set_xlim(0, xmax)

        for j in range(len(selected_rerankers)):
            offsets = y + left_offset + j * bar_height
            bars = ax.barh(offsets, data[:, j],
                           height=bar_height * 0.9,
                           label=model_display_names[j] if (row == 0 and col == 0) else None,
                           color=palette[j],
                           edgecolor='black', linewidth=0.3, zorder=4)

            # annotate each bar carefully to avoid overflow
            for i_bar, rect in enumerate(bars):
                val = rect.get_width()
                # skip zero values
                if val == 0:
                    continue

                # dynamic thresholds and offsets
                # if bar covers > 15% of xmax -> put annotation inside (right-aligned)
                # otherwise put it outside (left-aligned)
                try:
                    rel = val / xmax
                except Exception:
                    rel = 0
                xpad = xmax * 0.01 if xmax > 0 else 0.01
                fontsize = 9

                if rel >= 0.15:
                    # inside: place slightly left from bar end
                    ax.annotate(f"{val:.3f}",
                                xy=(val - xpad, rect.get_y() + rect.get_height() / 2),
                                xytext=(0, 0),
                                textcoords='offset points',
                                ha='right', va='center',
                                fontsize=fontsize, color='white', fontweight='semibold', zorder=5,
                                clip_on=True)
                else:
                    # outside: place slightly right of bar end
                    ax.annotate(f"{val:.3f}",
                                xy=(val + xpad, rect.get_y() + rect.get_height() / 2),
                                xytext=(0, 0),
                                textcoords='offset points',
                                ha='left', va='center',
                                fontsize=fontsize, color='black', zorder=5,
                                clip_on=False)

        ax.set_yticks(y)
        ax.set_yticklabels(k_labels, fontsize=11)
        ax.invert_yaxis()
        ax.set_xlabel("Score", fontsize=11)
        ax.set_title(metric, fontsize=13, fontweight='bold', pad=8)
        ax.grid(axis='x', linestyle='--', linewidth=0.6, zorder=0)

    # Turn off any unused axes
    total_plots = nrows * ncols
    for empty_idx in range(n_metrics, total_plots):
        r = empty_idx // ncols
        c = empty_idx % ncols
        axes[r][c].axis('off')

    # Super title (embedding model shown separately)
    fig.suptitle("Reranker Comparison",
                fontsize=18, y=0.985, fontweight='bold')

    # Legend below the subplots (single legend) using same palette
    handles = [mpatches.Patch(color=palette[i], edgecolor='black') for i in range(len(selected_rerankers))]
    labels = model_display_names
    # --- changed: move legend slightly lower to make room for centered bottom text
    fig.legend(handles, labels, loc='lower center', bbox_to_anchor=(0.5, -0.06),
               ncol=len(selected_rerankers), frameon=True)

    # --- changed: center the embedding-model text at the very bottom (middle)
    # place it after the legend so it's visually the final bottom-center element
    fig.text(0.5, 0.02, f"Embedding model: {embedding_model_name}",
             ha='center', fontsize=12)

    # adjust tight_layout rect to keep space for legend + bottom text
    plt.tight_layout(rect=[0, 0.06, 1, 0.94])
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close(fig)
    logging.info(f"Alternative (fixed) benchmark plot saved to: {output_path}")

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

    all_results = {}

    # Benchmark Retriever Only
    logging.info("\n===== Benchmarking: retriever_only =====")
    retriever_only_model = RetrieverOnlySearch(embedding_model)
    retriever = EvaluateRetrieval(retriever_only_model, score_function="dot")
    results = retriever.retrieve(corpus, queries)
    
    logging.info("Evaluating results for retriever_only...")
    k_values = [1, 3, 5]
    ndcg, _map, recall, precision = retriever.evaluate(qrels, results, k_values)
    
    all_results["retriever_only"] = {"NDCG": ndcg, "MAP": _map, "Recall": recall, "Precision": precision}
    
    print(f"\n--- Results for retriever_only ---")
    print(f"NDCG@k: {json.dumps(ndcg, indent=2)}")
    print(f"MAP@k: {json.dumps(_map, indent=2)}")
    print(f"Recall@k: {json.dumps(recall, indent=2)}")
    print(f"Precision@k: {json.dumps(precision, indent=2)}")
    print("-----------------------------------\n")

    # Benchmark Reranker Models
    for reranker_name in RERANKER_MODEL_NAMES:
        logging.info(f"\n===== Benchmarking: {reranker_name} =====")
        reranker_model = CrossEncoder(reranker_name, trust_remote_code=True, device=DEVICE)
        
        reranker_search_model = RerankerSearch(embedding_model, reranker_model)
        retriever = EvaluateRetrieval(reranker_search_model, score_function="dot")
        results = retriever.retrieve(corpus, queries)
        
        logging.info(f"Evaluating results for {reranker_name}...")
        k_values = [1, 3, 5]
        ndcg, _map, recall, precision = retriever.evaluate(qrels, results, k_values)
        
        all_results[reranker_name] = {"NDCG": ndcg, "MAP": _map, "Recall": recall, "Precision": precision}
        
        print(f"\n--- Results for {reranker_name} ---")
        print(f"NDCG@k: {json.dumps(ndcg, indent=2)}")
        print(f"MAP@k: {json.dumps(_map, indent=2)}")
        print(f"Recall@k: {json.dumps(recall, indent=2)}")
        print(f"Precision@k: {json.dumps(precision, indent=2)}")
        print("-----------------------------------\n")


    # After running all benchmarks, generate the plot
    plot_benchmark_results(all_results,
                                   os.path.join(os.path.dirname(__file__), "benchmark_rerankers_results.png"))
    logging.info("Benchmark finished.")

if __name__ == "__main__":
    main()
