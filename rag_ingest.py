# -*- coding: utf-8 -*-
"""Script de Ingestão e Processamento do Acervo de Conhecimento RAG da Kaelara.

Varre documentos técnicos (.md, .txt, .pdf), divide o texto em blocos (chunks)
com janela deslizante de sobreposição (overlap), comprime com zlib para economia
de armazenamento e persiste com hash sha256 anti-duplicidade em banco SQLite.
Possui trava de segurança para limite máximo de armazenamento (50 MB).
"""

import hashlib
import os
from pathlib import Path
import sqlite3
from typing import List
import zlib
from datetime import UTC, datetime

# Caminho para o banco de dados de conhecimento SQLite
DB_PATH = os.getenv("SQLITE_DB_PATH", "/opt/kaelara/kaelara_memoria.db")

# Diretório de documentos a ser varrido
DOCS_ROOT = Path(r"D:\Kaelara\conhecimento")

CHUNK_SIZE = 1000          # Caracteres máximos por bloco
OVERLAP = 150              # Caracteres de sobreposição entre blocos consecutivos
MAX_DB_SIZE_BYTES = 50 * 1024 * 1024  # Limite máximo de 50 MB para a tabela rag_chunks


def get_db_connection():
    """Estabelece e configura uma conexão com o banco SQLite de conhecimento.

    Returns:
        Instância de sqlite3.Connection com sqlite3.Row para acesso por chave.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def current_db_size(conn) -> int:
    """Calcula o tamanho total em bytes ocupado pelo texto comprimido na tabela rag_chunks.

    Args:
        conn: Conexão ativa com o banco SQLite.

    Returns:
        Tamanho consolidado em bytes.
    """
    cur = conn.cursor()
    cur.execute("SELECT SUM(LENGTH(chunk_text)) FROM rag_chunks")
    size = cur.fetchone()[0]
    return size if size is not None else 0


def chunk_text(text: str) -> List[str]:
    """Divide uma cadeia de texto contínua em fragmentos com janela deslizante de sobreposição.

    Args:
        text: Texto completo do documento.

    Returns:
        Lista de fragmentos textuais (chunks) com tamanho até CHUNK_SIZE.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - OVERLAP
    return chunks


def ingest_file(file_path: Path, conn):
    """Processa um arquivo individual, extrai seu texto e armazena os chunks comprimidos.

    Args:
        file_path: Caminho do arquivo a ser ingerido (.md, .txt ou .pdf).
        conn: Conexão ativa com o banco de dados SQLite.

    Raises:
        MemoryError: Se a inserção exceder o limite de 50 MB da tabela.
        RuntimeError: Se um PDF for submetido e pdfminer.six não estiver instalado.
    """
    # Leitura de arquivos de texto plano e markdown
    if file_path.suffix.lower() in {".txt", ".md"}:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    elif file_path.suffix.lower() == ".pdf":
        try:
            from pdfminer.high_level import extract_text
        except ImportError:
            raise RuntimeError("pdfminer.six não está instalado. Instale antes de usar ingestão PDF.")
        content = extract_text(str(file_path))
    else:
        return  # Tipo de arquivo não suportado

    for chunk in chunk_text(content):
        # Compressão zlib de alta densidade
        compressed = zlib.compress(chunk.encode("utf-8"))
        # Hash SHA-256 para prevenção estrita de redundâncias
        chunk_hash = hashlib.sha256(compressed).hexdigest()

        # Verifica limite de tamanho estipulado antes de inserir
        if current_db_size(conn) + len(compressed) > MAX_DB_SIZE_BYTES:
            raise MemoryError("Limite de 50 MB para rag_chunks atingido. Ingestão interrompida.")

        cur = conn.cursor()
        cur.execute("SELECT 1 FROM rag_chunks WHERE chunk_hash = ?", (chunk_hash,))
        if cur.fetchone():
            continue  # Já existente no banco

        cur.execute(
            """
            INSERT INTO rag_chunks (doc_name, chunk_text, chunk_hash, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (file_path.name, compressed, chunk_hash, datetime.now(UTC).isoformat()),
        )
        conn.commit()


def ingest_documents():
    """Varre a pasta de conhecimento recursivamente e executa a ingestão em lote.

    Raises:
        FileNotFoundError: Se a pasta DOCS_ROOT não for localizada.
    """
    if not DOCS_ROOT.is_dir():
        raise FileNotFoundError(f"Diretório de conhecimento não encontrado: {DOCS_ROOT}")
    conn = get_db_connection()
    try:
        for file_path in DOCS_ROOT.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in {".txt", ".md", ".pdf"}:
                ingest_file(file_path, conn)
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        ingest_documents()
        print("Ingestão concluída com sucesso.")
    except Exception as e:
        print(f"Erro na ingestão: {e}")
