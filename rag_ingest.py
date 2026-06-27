# -*- coding: utf-8 -*-
# ===============================================================================
# rag_ingest.py – Script de ingestão RAG para Kaelara V8.0
# ===============================================================================
# Diretriz: varrer a pasta D:\Kaelara\conhecimento, gerar chunks de até 1000
# caracteres com sobreposição de 150, comprimir com zlib e armazenar em SQLite.
# Limite máximo da tabela rag_chunks: 50 MB.
# ===============================================================================

import os
import sqlite3
import zlib
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List

# Importa a mesma base de dados usada pelo app
DB_PATH = os.getenv('SQLITE_DB_PATH', '/opt/kaelara/kaelara_memoria.db')

# Diretório de documentos a ser varrido (confirmado pela Diretoria)
DOCS_ROOT = Path(r'D:\Kaelara\conhecimento')

CHUNK_SIZE = 1000          # caracteres máximos por chunk
OVERLAP = 150              # caracteres de sobreposição entre chunks
MAX_DB_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def current_db_size(conn) -> int:
    """Retorna o tamanho total em bytes da tabela rag_chunks (campo chunk_text)."""
    cur = conn.cursor()
    cur.execute('SELECT SUM(LENGTH(chunk_text)) FROM rag_chunks')
    size = cur.fetchone()[0]
    return size if size is not None else 0


def chunk_text(text: str) -> List[str]:
    """Divide *text* em chunks de até CHUNK_SIZE com OVERLAP entre eles."""
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
    """Ingesta um único arquivo, gerando e armazenando seus chunks."""
    # Leitura simples para .txt e .md
    if file_path.suffix.lower() in {'.txt', '.md'}:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    elif file_path.suffix.lower() == '.pdf':
        try:
            from pdfminer.high_level import extract_text
        except ImportError as e:
            raise RuntimeError('pdfminer.six não está instalado. Instale antes de usar ingestão PDF.')
        content = extract_text(str(file_path))
    else:
        return  # tipo não suportado

    for chunk in chunk_text(content):
        # Compressão zlib
        compressed = zlib.compress(chunk.encode('utf-8'))
        # Hash para evitar duplicatas
        chunk_hash = hashlib.sha256(compressed).hexdigest()
        # Verifica limite de tamanho antes de inserir
        if current_db_size(conn) + len(compressed) > MAX_DB_SIZE_BYTES:
            # Excede limite – interrompe a ingestão totalmente
            raise MemoryError('Limite de 50 MB para rag_chunks atingido. Ingestão interrompida.')
        # Insere, evitando duplicatas de hash
        cur = conn.cursor()
        cur.execute('SELECT 1 FROM rag_chunks WHERE chunk_hash = ?', (chunk_hash,))
        if cur.fetchone():
            continue  # já existe
        cur.execute(
            '''
            INSERT INTO rag_chunks (doc_name, chunk_text, chunk_hash, created_at)
            VALUES (?,?,?,?)
            ''',
            (file_path.name, compressed, chunk_hash, datetime.utcnow().isoformat())
        )
        conn.commit()


def ingest_documents():
    """Varre DOCS_ROOT recursivamente e ingere todos os arquivos suportados.
    Qualquer erro crítico interrompe a operação, permitindo ao chamador tratar a exceção.
    """
    if not DOCS_ROOT.is_dir():
        raise FileNotFoundError(f'Diretório de conhecimento não encontrado: {DOCS_ROOT}')
    conn = get_db_connection()
    try:
        for file_path in DOCS_ROOT.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in {'.txt', '.md', '.pdf'}:
                ingest_file(file_path, conn)
    finally:
        conn.close()

# Permite execução direta via CLI para testes rápidos
if __name__ == '__main__':
    try:
        ingest_documents()
        print('Ingestão concluída com sucesso.')
    except Exception as e:
        print(f'Erro na ingestão: {e}')
