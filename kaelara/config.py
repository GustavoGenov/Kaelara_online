"""Módulo de Configuração Central da Kaelara A.I.

Responsável por carregar variáveis de ambiente a partir do arquivo `.env`,
sanitizar chaves de API e URLs, e definir credenciais para provedores de LLM
(Google Gemini, OpenAI, Groq, xAI Grok), banco de dados (SQLite/Supabase)
e políticas de retenção temporal de arquivos de mídia (TTL).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Diretório raiz do projeto e carregamento do arquivo .env
BASE_DIR = Path(__file__).resolve().parents[1]
env_path = BASE_DIR / ".env"
if env_path.is_file():
    load_dotenv(dotenv_path=env_path)


def _clean_env(key: str, default: str | None = None) -> str | None:
    """Extrai e sanitiza uma variável de ambiente, removendo aspas e espaços espúrios.

    Args:
        key: Nome da variável de ambiente no sistema ou no arquivo .env.
        default: Valor padrão caso a variável não esteja definida ou seja vazia.

    Returns:
        String limpa com o valor da variável de ambiente, ou o valor padrão fornecido.
    """
    val = os.getenv(key, default)
    if val is None:
        return None
    cleaned = val.strip().strip("'\"").strip()
    return cleaned if cleaned else default


# Configurações de Conexão com Banco de Dados (Supabase PostgreSQL / SQLite Local)
DATABASE_URL = _clean_env("DATABASE_URL", f"sqlite:///{(BASE_DIR / 'kaelara.db').as_posix()}")
SUPABASE_URL = _clean_env("SUPABASE_URL")
SUPABASE_KEY = _clean_env("SUPABASE_SERVICE_ROLE_KEY") or _clean_env("SUPABASE_KEY")

# Conexão de Cache com Redis
REDIS_URL = _clean_env("REDIS_URL", "redis://localhost:6379/0")

# Credenciais do Google Custom Search Engine (Busca Web)
GOOGLE_API_KEY = _clean_env("GOOGLE_API_KEY")
GOOGLE_CSE_ID = _clean_env("GOOGLE_CSE_ID")

# Credenciais e Modelo do Google Gemini (Provedor Primário de IA Cognitiva)
GEMINI_API_KEY = _clean_env("GEMINI_API_KEY")
GEMINI_MODEL_NAME = _clean_env("GEMINI_MODEL_NAME", "gemini-3.6-flash")

# Credenciais e Endpoint compatíveis com OpenAI
OPENAI_API_KEY = _clean_env("OPENAI_API_KEY")
OPENAI_MODEL_NAME = _clean_env("OPENAI_MODEL_NAME")
OPENAI_BASE_URL = _clean_env("OPENAI_BASE_URL", "https://api.openai.com/v1")

# Credenciais e Endpoint do Groq (Inferência Ultrarrápida)
GROQ_API_KEY = _clean_env("GROQ_API_KEY")
GROQ_MODEL_NAME = _clean_env("GROQ_MODEL_NAME")
GROQ_BASE_URL = _clean_env("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

# Credenciais e Endpoint do xAI Grok
GROK_API_KEY = _clean_env("GROK_API_KEY")
GROK_MODEL_NAME = _clean_env("GROK_MODEL_NAME")
GROK_BASE_URL = _clean_env("GROK_BASE_URL", "https://api.x.ai/v1")

# Tempo de vida útil (Time To Live em segundos) para mídias temporárias geradas (áudio/visão)
MEDIA_TTL = int(_clean_env("MEDIA_TTL", "86400") or "86400")
