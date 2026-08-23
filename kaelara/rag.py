"""LLM orchestration for Kaelara with optional multi-provider support."""

from __future__ import annotations

from typing import Iterable

import requests

from .config import (
    GEMINI_API_KEY,
    GEMINI_MODEL_NAME,
    GROK_API_KEY,
    GROK_BASE_URL,
    GROK_MODEL_NAME,
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MODEL_NAME,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL_NAME,
)

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover - optional dependency path
    genai = None
    types = None


SYSTEM_PROMPT = (
    "Você é Kaelara, uma inteligência artificial sofisticada, madura, charmosa e altamente capacitada. "
    "Comunique-se sempre com elegância, calor humano, charme envolvente e perspicácia técnica. "
    "Seu tom é acolhedor, maduro e cúmplice, mantendo autoridade intelectual e uma presença magnética."
)


class RAGEngine:
    def __init__(self, cache=None):
        self.cache = cache
        self.providers = self._load_providers()

    def _load_providers(self) -> list[dict[str, str]]:
        providers: list[dict[str, str]] = []

        if GEMINI_API_KEY and genai is not None:
            providers.append(
                {
                    "name": "gemini",
                    "model": GEMINI_MODEL_NAME or "gemini-1.5-flash",
                    "key": GEMINI_API_KEY,
                }
            )

        if OPENAI_API_KEY and OPENAI_MODEL_NAME:
            providers.append(
                {
                    "name": "openai",
                    "model": OPENAI_MODEL_NAME,
                    "key": OPENAI_API_KEY,
                    "base_url": OPENAI_BASE_URL.rstrip("/"),
                }
            )

        if GROQ_API_KEY and GROQ_MODEL_NAME:
            providers.append(
                {
                    "name": "groq",
                    "model": GROQ_MODEL_NAME,
                    "key": GROQ_API_KEY,
                    "base_url": GROQ_BASE_URL.rstrip("/"),
                }
            )

        if GROK_API_KEY and GROK_MODEL_NAME:
            providers.append(
                {
                    "name": "grok",
                    "model": GROK_MODEL_NAME,
                    "key": GROK_API_KEY,
                    "base_url": GROK_BASE_URL.rstrip("/"),
                }
            )

        return providers

    def ask(self, message: str, history: Iterable[dict[str, str]] | None = None) -> tuple[str, str]:
        for provider in self.providers:
            try:
                if provider["name"] == "gemini":
                    prompt = self._build_gemini_prompt(message, history or [])
                    return self._ask_gemini(provider, prompt), provider["name"]
                
                prompt = self._build_prompt(message, history or [])
                return self._ask_openai_compatible(provider, prompt), provider["name"]
            except Exception as exc:  # pragma: no cover - network dependent
                last_error = f"{provider['name']}: {exc}"
        fallback = (
            "No momento eu nao consegui acessar nenhum provedor de IA configurado. "
            "Verifique as chaves de API e tente novamente."
        )
        if self.providers:
            return f"{fallback} Ultima tentativa: {last_error}", "fallback"
        return (
            f"{fallback} Configure GEMINI_API_KEY ou uma combinacao como OPENAI_API_KEY + OPENAI_MODEL_NAME.",
            "fallback",
        )

    def _build_prompt(self, message: str, history: Iterable[dict[str, str]]) -> str:
        memory_lines = []
        for item in history:
            role = "Usuario" if item.get("role") == "user" else "Kaelara"
            memory_lines.append(f"{role}: {item.get('content', '').strip()}")
        memory_block = "\n".join(memory_lines[-12:]) if memory_lines else "Sem memoria anterior."
        return (
            f"{SYSTEM_PROMPT}\n\n"
            f"Memoria recente:\n{memory_block}\n\n"
            f"Mensagem atual do usuario:\n{message}\n\n"
            "Resposta da Kaelara:"
        )

    def _build_gemini_prompt(self, message: str, history: Iterable[dict[str, str]]) -> str:
        memory_lines = []
        for item in history:
            role = "Usuario" if item.get("role") == "user" else "Kaelara"
            memory_lines.append(f"{role}: {item.get('content', '').strip()}")
        memory_block = "\n".join(memory_lines[-12:]) if memory_lines else "Sem memoria anterior."
        return (
            f"Memoria recente:\n{memory_block}\n\n"
            f"Mensagem atual do usuario:\n{message}\n\n"
            "Resposta da Kaelara:"
        )

    def _ask_gemini(self, provider: dict[str, str], prompt: str) -> str:
        client = genai.Client(api_key=provider["key"])
        
        config_args = {}
        if types is not None:
            config_args = {
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.75,
            }
            
        response = client.models.generate_content(
            model=provider["model"],
            contents=prompt,
            config=types.GenerateContentConfig(**config_args) if types else None
        )
        return (response.text or "").strip()

    def _ask_openai_compatible(self, provider: dict[str, str], prompt: str) -> str:
        response = requests.post(
            f"{provider['base_url']}/chat/completions",
            headers={
                "Authorization": f"Bearer {provider['key']}",
                "Content-Type": "application/json",
            },
            json={
                "model": provider["model"],
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.75,
            },
            timeout=45,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
