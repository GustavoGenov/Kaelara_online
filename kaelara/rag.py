# kaelara/rag.py
"""Retrieval‑Augmented Generation (RAG) engine.
- Uses FAISS (GPU if available) for vector similarity.
- LangChain orchestrates the pipeline.
- Underlying LLM is Gemma‑4‑12B loaded via HuggingFace + torch‑rocm.
- Integrates cache to avoid recomputing for repeated queries.
"""
import os
import json
from typing import List

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA

from .config import GEMMA_MODEL_NAME
from .cache import Cache

class RAGEngine:
    def __init__(self, cache: Cache, device: str = None):
        self.cache = cache
        # Determine device – prefer GPU if torch reports cuda or rocm
        if device:
            self.device = device
        else:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # Load tokenizer & model (8‑bit quantized for memory efficiency)
        self.tokenizer = AutoTokenizer.from_pretrained(GEMMA_MODEL_NAME, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            GEMMA_MODEL_NAME,
            device_map="auto",
            torch_dtype=torch.float16,
            trust_remote_code=True,
            low_cpu_mem_usage=True,
        ).to(self.device)
        # Embeddings – use the same model as sentence‑transformer fallback
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        # Initialise (or load) FAISS index – placeholder empty index for now
        self.index = FAISS.from_texts([], self.embeddings)
        # Retrieval QA chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.model,
            retriever=self.index.as_retriever(search_kwargs={"k": 4}),
        )

    def add_documents(self, docs: List[str]):
        """Add new documents to the FAISS index. Called during startup or via admin endpoint."""
        if not docs:
            return
        new_index = FAISS.from_texts(docs, self.embeddings)
        # Merge with existing index (FAISS supports + operator)
        self.index = self.index.merge_from(new_index)
        # Update retriever
        self.qa_chain.retriever = self.index.as_retriever(search_kwargs={"k": 4})

    def ask(self, query: str) -> str:
        # Check cache first
        cached = self.cache.get_cached_response(query)
        if cached:
            return cached
        # Run retrieval‑augmented generation
        answer = self.qa_chain.run(query)
        # Store in cache for future
        self.cache.cache_response(query, answer)
        return answer
