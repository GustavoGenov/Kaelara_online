# kaelara/database.py
"""SQLAlchemy database setup.
Provides engine, session factory and Base class.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import DATABASE_URL

# Create engine (pool_pre_ping=True for reliability)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

# SessionLocal class for request‑scoped sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for model definitions
Base = declarative_base()

def get_db():
    """Yield a database session; to be used with FastAPI/Flask dependency injection.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
