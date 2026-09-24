# kaelara/cache.py
"""Camada de Abstração de Cache da Kaelara.

Gerencia o armazenamento temporário de respostas de inferência, estados de sessão e metadados.
Implementa suporte transparente a Redis como backend primário e fallback automático para
um dicionário em memória com controle de TTL (Time-To-Live) quando o Redis não estiver disponível.
"""

import json
import time
from typing import Any, Optional

import redis

from .config import MEDIA_TTL, REDIS_URL


class Cache:
    """Interface unificada de cache com expiração automática por tempo de vida (TTL)."""

    def __init__(self, redis_url: str = REDIS_URL, default_ttl: int = MEDIA_TTL):
        """Inicializa o cliente de cache tentando conexão com o Redis e fallback em memória.

        Args:
            redis_url: String de conexão URL para o servidor Redis (ex: redis://localhost:6379/0).
            default_ttl: Tempo de vida padrão em segundos para os itens armazenados.
        """
        self.default_ttl = default_ttl
        try:
            self.client = redis.from_url(redis_url, decode_responses=True)
            # Testa a conexão executando ping
            self.client.ping()
            self._use_redis = True
        except Exception:
            # Fallback seguro para dicionário em memória
            self.client = {}
            self._use_redis = False

    # ------------------- Métodos de Manipulação Redis / Memória -------------------
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Armazena um valor serializado em JSON sob a chave especificada.

        Args:
            key: Identificador único da chave no cache.
            value: Valor ou estrutura de dados a ser armazenada (serializável em JSON).
            ttl: Tempo de vida opcional em segundos. Se omitido, usa default_ttl.
        """
        ttl = ttl or self.default_ttl
        payload = json.dumps(value)
        if self._use_redis:
            self.client.setex(name=key, time=ttl, value=payload)
        else:
            expire_at = time.time() + ttl
            self.client[key] = (payload, expire_at)

    def get(self, key: str) -> Optional[Any]:
        """Recupera e desserializa um valor do cache se ainda não tiver expirado.

        Args:
            key: Identificador da chave no cache.

        Returns:
            O dado desserializado em formato nativo Python, ou None se inexistente ou expirado.
        """
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
        """Remove explicitamente uma chave do cache.

        Args:
            key: Identificador da chave a ser eliminada.
        """
        if self._use_redis:
            self.client.delete(key)
        else:
            self.client.pop(key, None)

    def clear(self) -> None:
        """Limpa todos os dados armazenados no cache (flush)."""
        if self._use_redis:
            self.client.flushdb()
        else:
            self.client.clear()

    # ------------------- Métodos Utilitários de Resposta -------------------
    def cache_response(self, query: str, response: Any) -> None:
        """Armazena em cache a resposta gerada por IA associada a uma consulta do usuário.

        Args:
            query: Texto da consulta ou prompt do usuário.
            response: Resposta do modelo de linguagem ou payload retornado.
        """
        self.set(key=f"resp:{query}", value=response)

    def get_cached_response(self, query: str) -> Optional[Any]:
        """Busca no cache uma resposta previamente gerada para a mesma consulta.

        Args:
            query: Texto da consulta do usuário.

        Returns:
            Resposta em cache se válida, ou None caso não encontrada.
        """
        return self.get(key=f"resp:{query}")
