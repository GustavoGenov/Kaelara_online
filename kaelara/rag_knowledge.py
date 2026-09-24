"""Módulo de Conhecimento e RAG Semântico Especializado da Kaelara.

Fornece mecanismos de recuperação textual e autoconhecimento operacional,
permitindo que a IA consulte diretrizes, documentos técnicos (mais de 500 títulos em medicina,
direito, cibersegurança, enfermagem, etc.) e o manual operacional de sua própria arquitetura.
"""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

from .config import BASE_DIR

log = logging.getLogger("kaelara.rag_knowledge")

LOCAL_KNOWLEDGE_DIR = Path(
    os.getenv("KNOWLEDGE_DIR", r"E:\Backup_Projetos_Organizados\Kaelara_Local\conhecimento")
)
INTERNAL_KNOWLEDGE_DIR = Path(BASE_DIR) / "kaelara" / "knowledge"

_autoconhecimento_cache: list[dict[str, str]] | None = None
_catalog_cache: dict[str, Any] | None = None


def _load_autoconhecimento() -> list[dict[str, str]]:
    """Carrega e segmenta em seções o documento de Autoconhecimento Operacional da Kaelara.

    Busca primariamente no pacote interno `kaelara/knowledge/` e, como fallback,
    no acervo local da máquina de desenvolvimento.

    Returns:
        Lista de seções com título, conteúdo, fonte e categoria.
    """
    global _autoconhecimento_cache
    if _autoconhecimento_cache is not None:
        return _autoconhecimento_cache

    doc_path = None
    if (INTERNAL_KNOWLEDGE_DIR / "AUTOCONHECIMENTO_OPERACIONAL_KAELARA.md").exists():
        doc_path = INTERNAL_KNOWLEDGE_DIR / "AUTOCONHECIMENTO_OPERACIONAL_KAELARA.md"
    elif (LOCAL_KNOWLEDGE_DIR / "AUTOCONHECIMENTO_OPERACIONAL_KAELARA.md").exists():
        doc_path = LOCAL_KNOWLEDGE_DIR / "AUTOCONHECIMENTO_OPERACIONAL_KAELARA.md"

    sections: list[dict[str, str]] = []
    if doc_path and doc_path.exists():
        try:
            content = doc_path.read_text(encoding="utf-8", errors="replace")
            raw_sections = re.split(r"\n(?=##?\s)", content)
            for sec in raw_sections:
                sec_clean = sec.strip()
                if not sec_clean:
                    continue
                first_line = sec_clean.split("\n", 1)[0].replace("#", "").strip()
                sections.append({
                    "title": first_line or "Autoconhecimento",
                    "content": sec_clean,
                    "source": "AUTOCONHECIMENTO_OPERACIONAL_KAELARA.md",
                    "category": "Autoconhecimento",
                })
        except Exception as exc:
            log.warning("Erro ao carregar autoconhecimento: %s", exc)

    _autoconhecimento_cache = sections
    return _autoconhecimento_cache


def _load_catalog() -> dict[str, Any]:
    """Carrega o catálogo JSON de documentos especializados compilados no acervo.

    Returns:
        Dicionário com o total de documentos e índice por categoria temática.
    """
    global _catalog_cache
    if _catalog_cache is not None:
        return _catalog_cache

    cat_path = INTERNAL_KNOWLEDGE_DIR / "knowledge_catalog.json"
    if cat_path.exists():
        try:
            with open(cat_path, "r", encoding="utf-8") as f:
                _catalog_cache = json.load(f)
                return _catalog_cache
        except Exception as exc:
            log.warning("Erro ao carregar catálogo de conhecimento: %s", exc)

    _catalog_cache = {"total_documents": 0, "categories": {}}
    return _catalog_cache


def _score_text(query_terms: set[str], text: str) -> float:
    """Calcula pontuação de relevância léxica de um texto com base na frequência dos termos.

    Args:
        query_terms: Conjunto de palavras-chave da consulta.
        text: Texto alvo para análise de frequência.

    Returns:
        Pontuação numérica ponderada.
    """
    text_lower = text.lower()
    score = 0.0
    for term in query_terms:
        if len(term) <= 2:
            continue
        count = text_lower.count(term)
        if count > 0:
            score += min(count, 5) * (1.5 if len(term) > 5 else 1.0)
    return score


def search_knowledge(query: str, top_k: int = 3) -> list[dict[str, str]]:
    """Pesquisa por trechos relevantes no acervo de autoconhecimento e documentos temáticos.

    Realiza scoring ponderado de correspondência, dando prioridade para títulos de módulos,
    seções de autoconhecimento sobre o Criador Gustavo e categorias especializadas.

    Args:
        query: Consulta ou pergunta enviada pelo usuário.
        top_k: Número máximo de resultados deduplicados a retornar.

    Returns:
        Lista de dicionários contendo title, content, source e category.
    """
    if not query or not query.strip():
        return []

    query_clean = re.sub(r"[^\w\s]", " ", query.lower())
    terms = set(t for t in query_clean.split() if len(t) > 2)
    if not terms:
        return []

    results: list[tuple[float, dict[str, str]]] = []

    # 1. Buscar no Autoconhecimento Operacional
    sections = _load_autoconhecimento()
    for sec in sections:
        score = _score_text(terms, sec["title"]) * 2.5 + _score_text(terms, sec["content"])
        if any(w in terms for w in ["criador", "quem", "pai", "gustavo", "capacidades", "voce", "codigo", "sistema", "memoria"]):
            score += 1.0
        if score > 0.5:
            results.append((score, {
                "title": sec["title"],
                "content": sec["content"][:1000],
                "source": sec["source"],
                "category": sec["category"],
            }))

    # 2. Buscar no catálogo e categorias temáticas
    catalog = _load_catalog()
    for doc in catalog.get("documents", []):
        doc_name = doc.get("file", "")
        cat_name = doc.get("category", "")
        cat_score = _score_text(terms, cat_name) * 3.0 + _score_text(terms, doc_name) * 2.0
        if cat_score > 1.0:
            results.append((cat_score, {
                "title": f"Área de Conhecimento: {cat_name}",
                "content": f"Documento de referência disponível no acervo da Kaelara: '{doc_name}' na área de {cat_name}.",
                "source": doc.get("path", doc_name),
                "category": cat_name,
            }))

    # 3. Se disponível localmente, pesquisar nos diretórios locais
    if LOCAL_KNOWLEDGE_DIR.exists():
        try:
            for cat_dir in LOCAL_KNOWLEDGE_DIR.iterdir():
                if cat_dir.is_dir() and not cat_dir.name.startswith((".", "kae_")):
                    if any(t in cat_dir.name.lower() for t in terms):
                        results.append((5.0, {
                            "title": f"Módulo Especializado: {cat_dir.name}",
                            "content": f"A Kaelara possui documentação profunda e especializada em {cat_dir.name}, com diretrizes, protocolos e manuais técnicos.",
                            "source": cat_dir.name,
                            "category": cat_dir.name,
                        }))
        except Exception:
            pass

    results.sort(key=lambda x: x[0], reverse=True)

    seen_titles = set()
    unique_results: list[dict[str, str]] = []
    for score, item in results:
        if item["title"] not in seen_titles:
            seen_titles.add(item["title"])
            unique_results.append(item)
            if len(unique_results) >= top_k:
                break

    return unique_results


def get_knowledge_status() -> dict[str, Any]:
    """Retorna o estado e métricas de cobertura da base de conhecimento da Kaelara.

    Returns:
        Dicionário com contagem de documentos catalogados, categorias e seções de autoconhecimento.
    """
    catalog = _load_catalog()
    autoconhecimento = _load_autoconhecimento()
    local_connected = LOCAL_KNOWLEDGE_DIR.exists()

    return {
        "local_path": str(LOCAL_KNOWLEDGE_DIR) if local_connected else None,
        "local_connected": local_connected,
        "total_documents_catalog": catalog.get("total_documents", 0),
        "categories_count": catalog.get("categories_count", 0),
        "categories": list(catalog.get("categories", {}).keys()),
        "autoconhecimento_sections": len(autoconhecimento),
        "status": "online",
    }
