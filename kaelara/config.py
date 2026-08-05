"""Central configuration loader for Kaelara."""

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
env_path = BASE_DIR / ".env"
if env_path.is_file():
    load_dotenv(dotenv_path=env_path)


DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(BASE_DIR / 'kaelara.db').as_posix()}")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL_NAME = os.getenv("GROQ_MODEL_NAME")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_MODEL_NAME = os.getenv("GROK_MODEL_NAME")
GROK_BASE_URL = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")

MEDIA_TTL = int(os.getenv("MEDIA_TTL", "86400"))
