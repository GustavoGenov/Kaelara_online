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

# Database URL – required (e.g. Supabase connection string)
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://kaelara:senha@localhost/kaelara_db')

# Supabase API (For REST/Storage operations if needed)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Redis cache URL
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Google API keys (Custom Search & Translate)
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')

# Gemini API key for Google AI Studio
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')


# OpenAI API key (free tier)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Model configuration
GEMINI_MODEL_NAME = os.getenv('GEMINI_MODEL_NAME', 'gemini-1.5-flash')
# Media cleanup (seconds) – 24h = 86400
MEDIA_TTL = int(os.getenv('MEDIA_TTL', '86400'))
