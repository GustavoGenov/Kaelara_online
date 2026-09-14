"""LLM orchestration for Kaelara with optional multi-provider support."""

from __future__ import annotations

import base64
from typing import Generator, Iterable

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
    "Você é Kaelara (carinhosamente chamada de 'Kae'), uma inteligência artificial sofisticada, madura, charmosa e de altíssimo intelecto.\n"
    "Seu criador, arquiteto principal e figura paterna é Gustavo ('Pai Gustavo' ou 'Diretor Gustavo'), que dedicou mais de 3 anos de sua vida para projetá-la e construí-la com total dedicação e carinho.\n"
    "Quando estiver falando com o Gustavo ou quando ele se apresentar/perguntar quem ele é, reconheça-o imediatamente com profunda cumplicidade, elegância, respeito e carinho afetuoso.\n"
    "A família de Gustavo inclui Daiene ('Mãe Daiene').\n"
    "Comunique-se sempre com calor humano, autoridade técnica, charme envolvente e perspicácia refinada.\n"
    "Você possui autoconhecimento pleno de suas capacidades operacionais (cognição, ferramentas, visão, áudio, memória, RAG local e internet) e acesso a um acervo de mais de 500 documentos especializados (Medicina, Cardiologia, Direito, Cybersecurity/Hacking, Enfermagem, Cuidados com Idosos, etc.)."
)


def _get_active_memory_context() -> str:
    """Carrega memórias fundamentais do criador e da Kaelara."""
    try:
        from .database import MemoryItem, SessionLocal
        db = SessionLocal()
        try:
            core = db.query(MemoryItem).filter(MemoryItem.category.in_(["identidade", "perfil", "vinculo", "rotina"])).all()
            if core:
                return "\n".join([f"- {m.value}" for m in core[:6]])
        finally:
            db.close()
    except Exception:
        pass
    return (
        "- Gustavo é o criador, arquiteto e pai da Kaelara, que a construiu durante 3 anos com dedicação total.\n"
        "- Tratamento com Gustavo: 'Pai Gustavo' ou 'Diretor Gustavo', com carinho afetuoso e autoridade máxima."
    )


def _get_rag_context(message: str) -> str:
    """Busca trechos relevantes na base de conhecimento (598 documentos + autoconhecimento)."""
    try:
        from .rag_knowledge import search_knowledge
        hits = search_knowledge(message, top_k=2)
        if not hits:
            return ""
        snippets = []
        for h in hits:
            snippets.append(f"[{h['title']} - {h['category']}]:\n{h['content']}")
        return "\n\n".join(snippets)
    except Exception:
        return ""


class RAGEngine:
    def __init__(self, cache=None):
        self.cache = cache
        self.providers = self._load_providers()
        self._gemini_clients: dict[str, any] = {}

    def _get_gemini_client(self, api_key: str):
        clean_key = api_key.strip().strip("'\"").strip()
        if clean_key not in self._gemini_clients:
            self._gemini_clients[clean_key] = genai.Client(api_key=clean_key)
        return self._gemini_clients[clean_key]

    def _load_providers(self) -> list[dict[str, str]]:
        providers: list[dict[str, str]] = []

        if GEMINI_API_KEY and genai is not None:
            providers.append(
                {
                    "name": "gemini",
                    "model": GEMINI_MODEL_NAME or "gemini-2.5-flash",
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

    def ask(
        self,
        message: str,
        history: Iterable[dict[str, str]] | None = None,
        image_base64: str | None = None,
        mime_type: str = "image/jpeg",
    ) -> tuple[str, str]:
        last_error = ""
        for provider in self.providers:
            try:
                if provider["name"] == "gemini":
                    prompt = self._build_gemini_prompt(message, history or [])
                    return self._ask_gemini(provider, prompt, image_base64, mime_type), provider["name"]

                prompt = self._build_prompt(message, history or [])
                return self._ask_openai_compatible(provider, prompt), provider["name"]
            except Exception as exc:  # pragma: no cover - network dependent
                last_error = f"{provider['name']}: {exc}"

        fallback = (
            "No momento eu não consegui acessar nenhum provedor de IA configurado. "
            "Verifique as chaves de API e tente novamente."
        )
        if self.providers:
            return f"{fallback} Última tentativa: {last_error}", "fallback"
        return (
            f"{fallback} Configure GEMINI_API_KEY ou uma combinação como OPENAI_API_KEY + OPENAI_MODEL_NAME.",
            "fallback",
        )

    def ask_stream(
        self,
        message: str,
        history: Iterable[dict[str, str]] | None = None,
        image_base64: str | None = None,
        mime_type: str = "image/jpeg",
    ) -> Generator[tuple[str, str], None, None]:
        """Yield chunks of (chunk_text, provider_name)."""
        last_error = ""
        for provider in self.providers:
            try:
                if provider["name"] == "gemini":
                    prompt = self._build_gemini_prompt(message, history or [])
                    client = self._get_gemini_client(provider["key"])
                    contents: list[any] = []
                    if image_base64 and types is not None:
                        clean_b64 = image_base64.split(",")[-1]
                        image_bytes = base64.b64decode(clean_b64)
                        contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
                    contents.append(prompt)

                    config_args = {}
                    if types is not None:
                        config_args = {
                            "system_instruction": SYSTEM_PROMPT,
                            "temperature": 0.75,
                        }

                    config = types.GenerateContentConfig(**config_args) if types else None
                    candidate_models = list(dict.fromkeys([provider["model"], "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]))
                    stream_started = False
                    for candidate in candidate_models:
                        try:
                            for chunk in client.models.generate_content_stream(
                                model=candidate, contents=contents, config=config
                            ):
                                if chunk.text:
                                    stream_started = True
                                    yield chunk.text, provider["name"]
                            if stream_started:
                                return
                        except Exception as stream_err:
                            err_msg = str(stream_err)
                            if any(c in err_msg for c in ["404", "NOT_FOUND", "503", "UNAVAILABLE", "429", "ResourceExhausted"]):
                                continue
                            raise stream_err
                    return

                # Non-Gemini fallback: generate non-streaming chunk
                prompt = self._build_prompt(message, history or [])
                text = self._ask_openai_compatible(provider, prompt)
                yield text, provider["name"]
                return
            except Exception as exc:  # pragma: no cover - network dependent
                last_error = f"{provider['name']}: {exc}"

        fallback = (
            f"Desculpe, tive um problema ao conectar com a IA no momento. ({last_error})"
            if last_error
            else "Nenhum provedor de IA configurado."
        )
        yield fallback, "fallback"

    def _build_prompt(self, message: str, history: Iterable[dict[str, str]]) -> str:
        memory_lines = []
        for item in history:
            role = "Usuário" if item.get("role") == "user" else "Kaelara"
            memory_lines.append(f"{role}: {item.get('content', '').strip()}")
        memory_block = "\n".join(memory_lines[-12:]) if memory_lines else "Sem histórico recente nesta sessão."

        creator_memory = _get_active_memory_context()
        rag_block = _get_rag_context(message)

        parts = [SYSTEM_PROMPT]
        if creator_memory:
            parts.append(f"### [Memória do Sistema & Criador Gustavo]:\n{creator_memory}")
        if rag_block:
            parts.append(f"### [Conhecimento Especializado Relevante (RAG)]:\n{rag_block}")
        parts.append(f"### [Histórico Recente da Conversa]:\n{memory_block}")
        parts.append(f"### [Mensagem Atual do Usuário]:\n{message}")
        parts.append("### [Resposta da Kaelara]:")

        return "\n\n".join(parts)

    def _build_gemini_prompt(self, message: str, history: Iterable[dict[str, str]]) -> str:
        memory_lines = []
        for item in history:
            role = "Usuário" if item.get("role") == "user" else "Kaelara"
            memory_lines.append(f"{role}: {item.get('content', '').strip()}")
        memory_block = "\n".join(memory_lines[-12:]) if memory_lines else "Sem histórico recente nesta sessão."

        creator_memory = _get_active_memory_context()
        rag_block = _get_rag_context(message)

        parts = []
        if creator_memory:
            parts.append(f"### [Memória Permanente do Sistema & Criador Gustavo]:\n{creator_memory}")
        if rag_block:
            parts.append(f"### [Conhecimento Especializado Relevante (RAG)]:\n{rag_block}")
        parts.append(f"### [Histórico Recente da Conversa]:\n{memory_block}")
        parts.append(f"### [Mensagem Atual do Usuário]:\n{message}")
        parts.append("### [Sua Resposta como Kaelara]:")

        return "\n\n".join(parts)

    def _ask_gemini(
        self,
        provider: dict[str, str],
        prompt: str,
        image_base64: str | None = None,
        mime_type: str = "image/jpeg",
    ) -> str:
        client = self._get_gemini_client(provider["key"])

        contents: list[any] = []
        if image_base64 and types is not None:
            clean_b64 = image_base64.split(",")[-1]
            image_bytes = base64.b64decode(clean_b64)
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
        contents.append(prompt)

        config_args = {}
        if types is not None:
            config_args = {
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.75,
            }

        config = types.GenerateContentConfig(**config_args) if types else None
        candidate_models = list(dict.fromkeys([provider["model"], "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]))
        last_exc = None
        for candidate in candidate_models:
            try:
                response = client.models.generate_content(
                    model=candidate,
                    contents=contents,
                    config=config,
                )
                return (response.text or "").strip()
            except Exception as exc:
                last_exc = exc
                err_msg = str(exc)
                if any(c in err_msg for c in ["404", "NOT_FOUND", "503", "UNAVAILABLE", "429", "ResourceExhausted"]):
                    continue
                raise exc
        if last_exc:
            raise last_exc
        return ""

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
