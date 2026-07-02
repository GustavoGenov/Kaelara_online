# kaelara/cache.py
"""Cache abstraction.
Utiliza Redis quando disponível; caso contrário, recorre a um dicionário em memória.
Todos os itens têm TTL definido (default 24 h) e são automaticamente expirados.
"""
import json
import time
from typing import Any, Optional

import redis

from .config import REDIS_URL, MEDIA_TTL

class Cache:
    def __init__(self, redis_url: str = REDIS_URL, default_ttl: int = MEDIA_TTL):
        self.default_ttl = default_ttl
        try:
            self.client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.client.ping()
            self._use_redis = True
        except Exception:
            # Fallback to in‑memory dict
            self.client = {}
            self._use_redis = False

    # ------------------- Redis / Memory helpers -------------------
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl or self.default_ttl
        payload = json.dumps(value)
        if self._use_redis:
            self.client.setex(name=key, time=ttl, value=payload)
        else:
            expire_at = time.time() + ttl
            self.client[key] = (payload, expire_at)

    def get(self, key: str) -> Optional[Any]:
        if self._use_redis:
            raw = self.client.get(key)
            return json.loads(raw) if raw is not None else None
        else:
            entry = self.client.get(key)
            if not entry:
                return None
            payload, expire_at = entry
            if time.time() > expire_at:
                del self.client[key]
                return None
            return json.loads(payload)

    def delete(self, key: str) -> None:
        if self._use_redis:
            self.client.delete(key)
        else:
            self.client.pop(key, None)

    def clear(self) -> None:
        if self._use_redis:
            self.client.flushdb()
        else:
            self.client.clear()

    # ------------------- Convenience wrappers -------------------
    def cache_response(self, query: str, response: Any) -> None:
        """Cache a chat/RAG response keyed by the original query."""
        self.set(key=f"resp:{query}", value=response)

    def get_cached_response(self, query: str) -> Optional[Any]:
        return self.get(key=f"resp:{query}")
