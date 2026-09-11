"""Central configuration loader for Kaelara."""

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
env_path = BASE_DIR / ".env"
if env_path.is_file():
    load_dotenv(dotenv_path=env_path)


def _clean_env(key: str, default: str | None = None) -> str | None:
    val = os.getenv(key, default)
    if val is None:
        return None
    cleaned = val.strip().strip("'\"").strip()
    return cleaned if cleaned else default


DATABASE_URL = _clean_env("DATABASE_URL", f"sqlite:///{(BASE_DIR / 'kaelara.db').as_posix()}")

SUPABASE_URL = _clean_env("SUPABASE_URL")
SUPABASE_KEY = _clean_env("SUPABASE_SERVICE_ROLE_KEY") or _clean_env("SUPABASE_KEY")

REDIS_URL = _clean_env("REDIS_URL", "redis://localhost:6379/0")

GOOGLE_API_KEY = _clean_env("GOOGLE_API_KEY")
GOOGLE_CSE_ID = _clean_env("GOOGLE_CSE_ID")

GEMINI_API_KEY = _clean_env("GEMINI_API_KEY")
GEMINI_MODEL_NAME = _clean_env("GEMINI_MODEL_NAME", "gemini-3.6-flash")

OPENAI_API_KEY = _clean_env("OPENAI_API_KEY")
OPENAI_MODEL_NAME = _clean_env("OPENAI_MODEL_NAME")
OPENAI_BASE_URL = _clean_env("OPENAI_BASE_URL", "https://api.openai.com/v1")

GROQ_API_KEY = _clean_env("GROQ_API_KEY")
GROQ_MODEL_NAME = _clean_env("GROQ_MODEL_NAME")
GROQ_BASE_URL = _clean_env("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

GROK_API_KEY = _clean_env("GROK_API_KEY")
GROK_MODEL_NAME = _clean_env("GROK_MODEL_NAME")
GROK_BASE_URL = _clean_env("GROK_BASE_URL", "https://api.x.ai/v1")

MEDIA_TTL = int(_clean_env("MEDIA_TTL", "86400") or "86400")
