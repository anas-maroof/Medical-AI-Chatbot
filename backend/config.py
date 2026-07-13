import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

def _require(key: str) -> str:
    val = os.getenv(key)
    if not val:
        raise EnvironmentError(f"Missing required env variable: {key}")
    return val

# --- Required API Keys ---
PINECONE_API_KEY: str = _require("PINECONE_API_KEY")
GOOGLE_API_KEY: str   = _require("GOOGLE_API_KEY")
# Note: You can remove or keep OPENAI_API_KEY depending on whether you'll use it later
OPENAI_API_KEY: str   = os.getenv("OPENAI_API_KEY", "")

# --- Pinecone Configuration ---
PINECONE_INDEX_NAME: str  = os.getenv("PINECONE_INDEX_NAME", "medical-chatbot")
PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")

# --- Gemini Configuration ---
GEMINI_LLM_MODEL: str       = os.getenv("GEMINI_LLM_MODEL", "gemini-3.5-flash")
GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")

# --- Hugging Face Configuration ---
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
EMBEDDING_DIMENSION: int    = int(os.getenv("EMBEDDING_DIMENSION", "384"))

# --- OpenAI Models Configuration (Optional/Backup) ---
OPENAI_LLM_MODEL: str       = os.getenv("OPENAI_LLM_MODEL", "gpt-4o")
OPENAI_EMBEDDING_MODEL: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# --- Text Chunking Configuration ---
CHUNK_SIZE: int    = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "100"))

# --- Flask Server Configuration ---
FLASK_ENV: str        = os.getenv("FLASK_ENV", "development")
FLASK_SECRET_KEY: str = os.getenv("FLASK_SECRET_KEY", "dev-secret")
FLASK_PORT: int       = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG: bool     = FLASK_ENV == "development"

# --- Logging & Directory Setup ---
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
LOG_DIR: Path  = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

DATA_DIR: Path = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# --- LLM Hyperparameters ---
RETRIEVER_TOP_K: int     = int(os.getenv("RETRIEVER_TOP_K", "5"))
MAX_TOKENS_RESPONSE: int = int(os.getenv("MAX_TOKENS_RESPONSE", "2048"))
LLM_TEMPERATURE: float   = float(os.getenv("LLM_TEMPERATURE", "0.3"))

# --- Supabase & Authentication ---
SUPABASE_URL: str         = _require("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str = _require("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY: str    = os.getenv("SUPABASE_ANON_KEY", "")
JWT_SECRET: str           = _require("JWT_SECRET")
raw_expiry = os.getenv("JWT_EXPIRY_HOURS", "24")
JWT_EXPIRY_HOURS: int     = int(raw_expiry) if raw_expiry.strip() else 24