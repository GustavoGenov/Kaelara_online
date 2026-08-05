"""Database setup and persistence models for Kaelara."""

from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import BASE_DIR, DATABASE_URL


def _build_sqlite_fallback_url() -> str:
    return f"sqlite:///{(Path(BASE_DIR) / 'kaelara.db').as_posix()}"


def _resolve_engine():
    primary_engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False, future=True)
    try:
        with primary_engine.connect() as connection:
            connection.execute(text("select 1"))
        return primary_engine, DATABASE_URL
    except Exception as exc:
        fallback_url = _build_sqlite_fallback_url()
        print(f"[Aviso] Falha ao conectar no banco configurado. Usando SQLite local temporariamente: {exc}")
        fallback_engine = create_engine(fallback_url, pool_pre_ping=True, echo=False, future=True)
        return fallback_engine, fallback_url


engine, ACTIVE_DATABASE_URL = _resolve_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    session_id = Column(String(64), primary_key=True)
    title = Column(String(160), nullable=False, default="Nova conversa")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    def __init__(self, session_id: str, title: str | None = None):
        now = datetime.now(UTC)
        self.session_id = session_id
        self.title = title or "Nova conversa"
        self.created_at = now
        self.updated_at = now


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=False, index=True)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False)
    provider = Column(String(64), nullable=False, default="local")
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    def __init__(self, session_id: str, role: str, content: str, provider: str = "local"):
        self.session_id = session_id
        self.role = role
        self.content = content
        self.provider = provider
        self.created_at = datetime.now(UTC)


def init_db() -> None:
    """Create database tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a managed database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
