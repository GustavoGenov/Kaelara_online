# kaelara/config.py
"""Central configuration loader.
Loads environment variables and provides defaults.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present in project root
BASE_DIR = Path(__file__).resolve().parents[1]
env_path = BASE_DIR / '.env'
if env_path.is_file():
    load_dotenv(dotenv_path=env_path)

# Database URL – required
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://kaelara:senha@localhost/kaelara_db')

# Redis cache URL
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Google API keys (Custom Search & Translate)
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')

# OpenAI API key (free tier)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Model configuration
GEMMA_MODEL_NAME = os.getenv('GEMMA_MODEL_NAME', 'gemma-4b-12b')

# Media cleanup (seconds) – 24h = 86400
MEDIA_TTL = int(os.getenv('MEDIA_TTL', '86400'))
