"""Aplicação Web Flask e API RESTful da Kaelara A.I.

Fornece endpoints para chat síncrono e streaming SSE (Server-Sent Events),
histórico de conversas, telemetria e auditoria de visitas, perfil cognitivo de usuários,
busca semântica em base de conhecimento RAG, visão computacional e síntese vocal.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import UTC, datetime
import unicodedata
from uuid import uuid4

from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS
from sqlalchemy import desc, func

from .cache import Cache
from .config import MEDIA_TTL, REDIS_URL
from .database import ChatMessage, ChatSession, MemoryItem, SessionLocal, UserProfile, Visit, init_db
from .rag import RAGEngine
from .rag_knowledge import get_knowledge_status, search_knowledge

try:
    from .vision import Vision
except ImportError:  # pragma: no cover - optional dependency path
    Vision = None

try:
    from .audio import Audio
except ImportError:  # pragma: no cover - optional dependency path
    Audio = None


# Instanciação da aplicação Flask com suporte a CORS para o frontend Vite/React
app = Flask(__name__)
CORS(app)

try:
    init_db()
except Exception as exc:  # pragma: no cover - environment dependent
    print(f"[Aviso] Banco de dados nao inicializado: {exc}")

cache = Cache(redis_url=REDIS_URL)
rag = RAGEngine(cache=cache)
vision = Vision() if Vision is not None else None
audio = Audio() if Audio is not None else None


def _session_title(message: str) -> str:
    """Gera um título truncado e limpo para a sessão com base no primeiro prompt do usuário.

    Args:
        message: Primeira mensagem enviada na sessão.

    Returns:
        Título formatado com até 60 caracteres.
    """
    title = " ".join(message.strip().split())
    return (title[:57] + "...") if len(title) > 60 else (title or "Nova conversa")


def _serialize_message(message: ChatMessage) -> dict[str, str]:
    """Serializa uma instância ORM de ChatMessage para um dicionário JSON serializável.

    Args:
        message: Objeto da mensagem no banco de dados.

    Returns:
        Dicionário com id, session_id, role, content, provider e timestamp ISO.
    """
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "provider": message.provider,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def _get_or_create_session(db, session_id: str | None, first_message: str) -> ChatSession:
    """Recupera uma sessão de chat existente ou cria uma nova com identificador UUID.

    Args:
        db: Sessão ativa do SQLAlchemy.
        session_id: ID opcional da sessão fornecido pelo cliente.
        first_message: Mensagem inicial usada para definir o título da conversa.

    Returns:
        Instância ativa de ChatSession.
    """
    current_session_id = session_id or uuid4().hex
    session = db.get(ChatSession, current_session_id)
    if session is None:
        session = ChatSession(session_id=current_session_id, title=_session_title(first_message))
        db.add(session)
        db.flush()
    session.updated_at = datetime.now(UTC)
    if session.title == "Nova conversa" and first_message.strip():
        session.title = _session_title(first_message)
    return session


def _recent_history(db, session_id: str, limit: int = 12) -> list[dict[str, str]]:
    """Carrega os turnos mais recentes da conversa para alimentar a janela de contexto da LLM.

    Args:
        db: Sessão ativa do SQLAlchemy.
        session_id: ID da conversa.
        limit: Quantidade máxima de mensagens a recuperar.

    Returns:
        Lista ordenada cronologicamente de mensagens contendo 'role' e 'content'.
    """
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(desc(ChatMessage.id))
        .limit(limit)
        .all()
    )
    rows.reverse()
    return [{"role": row.role, "content": row.content} for row in rows]


def _normalize_name(text: str) -> str:
    """Normaliza nomes próprios removendo acentuação e convertendo para minúsculas."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    return re.sub(r"\s+", " ", text.strip().lower())


def extract_name_intent(text: str) -> str | None:
    """Analisa o texto do usuário para detectar intenção de apresentação pessoal de nome.

    Identifica padrões como 'me chamo X', 'meu nome é X', 'sou o X', ou respostas diretas
    a perguntas de identificação.

    Args:
        text: Mensagem enviada pelo usuário.

    Returns:
        Nome extraído e capitalizado (ex: 'Carlos Eduardo'), ou None se não for identificação.
    """
    if not text:
        return None
    norm = _normalize_name(text)

    # 1. Padrões com palavras-chave explícitas de introdução pessoal
    connectors = r"(?:\s+(?:e|que|como|mas|queria|gostaria|qual|o\s+que|prazer)\b|[,\.!\?]|$)"
    patterns = [
        r"(?:me\s+chamo|meu\s+nome\s+e|chamo-me)\s+([a-z]+(?:\s+(?!(?:e|que|como|mas|queria|gostaria)\b)[a-z]+)?)" + connectors,
        r"(?:eu\s+sou|sou\s+(?:o|a)?)\s+([a-z]+(?:\s+(?!(?:e|que|como|mas|queria|gostaria)\b)[a-z]+)?)" + connectors,
        r"(?:pode\s+me\s+chamar\s+de)\s+([a-z]+(?:\s+(?!(?:e|que|como|mas|queria|gostaria)\b)[a-z]+)?)" + connectors,
    ]
    for pat in patterns:
        m = re.search(pat, norm)
        if m:
            cand = m.group(1).strip()
            cand_words = [w for w in cand.split() if w not in ["um", "uma", "alguem", "humano", "amigo", "usuario", "cliente", "aqui"]]
            if cand_words:
                return " ".join(cand_words).title()

    # 2. Resposta curta respondendo 'Como posso te chamar?' (de 1 a 3 palavras)
    words = text.strip().split()
    if 1 <= len(words) <= 3:
        w1_norm = _normalize_name(words[0])
        stopwords = {
            "ola", "oi", "bom", "boa", "dia", "tarde", "noite", "tudo", "bem",
            "como", "vai", "quem", "voce", "kaelara", "kae", "sim", "nao",
            "clima", "tempo", "ajuda", "obrigado", "obrigada", "teste", "por", "favor",
            "qual", "onde", "quando", "porque", "oque"
        }
        if w1_norm not in stopwords and len(w1_norm) >= 2 and words[0].isalpha():
            return " ".join([w.capitalize() for w in words if w.isalpha()])

    return None


@app.route("/api/chat", methods=["POST"])
def chat():
    """Endpoint HTTP síncrono para envio e processamento de mensagens.

    Recebe JSON com 'message', 'session_id' e opcional 'image' (Base64).
    Atualiza perfis de usuário, persiste a mensagem no banco e invoca a RAGEngine.

    Returns:
        JSON com session_id, session_title, answer, provider, profile e messages.
    """
    data = request.get_json(silent=True) or {}
    user_msg = (data.get("message") or "").strip()
    image_b64 = data.get("image")
    if not user_msg and not image_b64:
        return jsonify({"error": "Empty message"}), 400

    db = SessionLocal()
    try:
        display_msg = user_msg or "[Imagem anexada]"
        session = _get_or_create_session(db, data.get("session_id"), display_msg)

        profile_data = None
        extracted_name = extract_name_intent(user_msg)
        if extracted_name:
            norm_u = _normalize_name(extracted_name)
            if "gustavo" not in norm_u:
                existing_profile = db.query(UserProfile).filter(UserProfile.username == norm_u).first()
                if existing_profile:
                    profile_data = {
                        "is_returning": True,
                        "display_name": existing_profile.display_name,
                        "username": existing_profile.username,
                    }
                    if existing_profile.current_session_id and existing_profile.current_session_id != session.session_id:
                        old_session = db.get(ChatSession, existing_profile.current_session_id)
                        if old_session:
                            session = old_session
                    existing_profile.current_session_id = session.session_id
                    existing_profile.updated_at = datetime.now(UTC)
                else:
                    new_profile = UserProfile(
                        username=norm_u,
                        display_name=extracted_name,
                        current_session_id=session.session_id,
                    )
                    db.add(new_profile)
                    profile_data = {
                        "is_returning": False,
                        "display_name": extracted_name,
                        "username": norm_u,
                    }
        else:
            active_prof = db.query(UserProfile).filter(UserProfile.current_session_id == session.session_id).first()
            if active_prof:
                profile_data = {
                    "is_returning": False,
                    "display_name": active_prof.display_name,
                    "username": active_prof.username,
                }

        if "jalhematei" in _normalize_name(user_msg):
            g_prof = db.query(UserProfile).filter(UserProfile.username == "gustavo").first()
            if g_prof:
                g_prof.current_session_id = session.session_id

        history = _recent_history(db, session.session_id)
        db.add(ChatMessage(session_id=session.session_id, role="user", content=display_msg, provider="client"))
        db.commit()

        if image_b64:
            try:
                answer, provider = rag.ask(user_msg or "Analise esta imagem, por favor.", history=history, image_base64=image_b64, profile_info=profile_data)
            except TypeError:
                try:
                    answer, provider = rag.ask(user_msg or "Analise esta imagem, por favor.", history=history, image_base64=image_b64)
                except TypeError:
                    answer, provider = rag.ask(user_msg or "Analise esta imagem, por favor.", history=history)
        else:
            try:
                answer, provider = rag.ask(user_msg, history=history, profile_info=profile_data)
            except TypeError:
                answer, provider = rag.ask(user_msg, history=history)

        db.add(ChatMessage(session_id=session.session_id, role="assistant", content=answer, provider=provider))
        session.updated_at = datetime.now(UTC)
        db.commit()

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.session_id)
            .order_by(ChatMessage.id.asc())
            .all()
        )
        return jsonify(
            {
                "session_id": session.session_id,
                "session_title": session.title,
                "answer": answer,
                "provider": provider,
                "profile": profile_data,
                "messages": [_serialize_message(message) for message in messages],
            }
        )
    except Exception as exc:
        db.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        db.close()


@app.route("/api/chat/stream", methods=["POST"])
def chat_stream():
    """Endpoint de streaming em tempo real via Server-Sent Events (SSE).

    Emite eventos contínuos ('chunk', 'done', 'error') permitindo renderização
    progressiva da resposta no frontend com latência mínima.

    Returns:
        Response com mimetype 'text/event-stream'.
    """
    data = request.get_json(silent=True) or {}
    user_msg = (data.get("message") or "").strip()
    image_b64 = data.get("image")
    session_id = data.get("session_id")
    if not user_msg and not image_b64:
        return jsonify({"error": "Empty message"}), 400

    def generate():
        db = SessionLocal()
        try:
            display_msg = user_msg or "[Imagem anexada]"
            session = _get_or_create_session(db, session_id, display_msg)

            profile_data = None
            extracted_name = extract_name_intent(user_msg)
            if extracted_name:
                norm_u = _normalize_name(extracted_name)
                if "gustavo" not in norm_u:
                    existing_profile = db.query(UserProfile).filter(UserProfile.username == norm_u).first()
                    if existing_profile:
                        profile_data = {
                            "is_returning": True,
                            "display_name": existing_profile.display_name,
                            "username": existing_profile.username,
                        }
                        if existing_profile.current_session_id and existing_profile.current_session_id != session.session_id:
                            old_session = db.get(ChatSession, existing_profile.current_session_id)
                            if old_session:
                                session = old_session
                        existing_profile.current_session_id = session.session_id
                        existing_profile.updated_at = datetime.now(UTC)
                    else:
                        new_profile = UserProfile(
                            username=norm_u,
                            display_name=extracted_name,
                            current_session_id=session.session_id,
                        )
                        db.add(new_profile)
                        profile_data = {
                            "is_returning": False,
                            "display_name": extracted_name,
                            "username": norm_u,
                        }
            else:
                active_prof = db.query(UserProfile).filter(UserProfile.current_session_id == session.session_id).first()
                if active_prof:
                    profile_data = {
                        "is_returning": False,
                        "display_name": active_prof.display_name,
                        "username": active_prof.username,
                    }

            if "jalhematei" in _normalize_name(user_msg):
                g_prof = db.query(UserProfile).filter(UserProfile.username == "gustavo").first()
                if g_prof:
                    g_prof.current_session_id = session.session_id

            history = _recent_history(db, session.session_id)
            db.add(ChatMessage(session_id=session.session_id, role="user", content=display_msg, provider="client"))
            db.commit()

            yield f"data: {json.dumps({'type': 'session', 'session_id': session.session_id, 'session_title': session.title, 'profile': profile_data}, ensure_ascii=False)}\n\n"

            accumulated = []
            chosen_provider = "gemini"
            query_text = user_msg or "Analise esta imagem, por favor."
            try:
                stream_gen = rag.ask_stream(query_text, history=history, image_base64=image_b64, profile_info=profile_data)
            except TypeError:
                stream_gen = rag.ask_stream(query_text, history=history, image_base64=image_b64)
            for chunk_text, provider_name in stream_gen:
                chosen_provider = provider_name
                accumulated.append(chunk_text)
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk_text}, ensure_ascii=False)}\n\n"

            full_answer = "".join(accumulated)
            db.add(ChatMessage(session_id=session.session_id, role="assistant", content=full_answer, provider=chosen_provider))
            session.updated_at = datetime.now(UTC)
            db.commit()

            all_msgs = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.session_id)
                .order_by(ChatMessage.id.asc())
                .all()
            )
            yield f"data: {json.dumps({'type': 'done', 'answer': full_answer, 'provider': chosen_provider, 'session_id': session.session_id, 'profile': profile_data, 'messages': [_serialize_message(m) for m in all_msgs]}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            db.rollback()
            yield f"data: {json.dumps({'type': 'error', 'error': str(exc)}, ensure_ascii=False)}\n\n"
        finally:
            db.close()

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


@app.route("/api/history", methods=["GET"])
def history():
    """Lista as sessões de conversas anteriores com prévias e contagem de mensagens.

    Query params:
        limit (int): Máximo de sessões retornadas (padrão: 20, máx: 100).
        q (str): Filtro de busca textual no conteúdo das mensagens.

    Returns:
        JSON com a lista de sessões cadastradas.
    """
    limit = min(max(int(request.args.get("limit", 20)), 1), 100)
    query = (request.args.get("q") or "").strip().lower()

    db = SessionLocal()
    try:
        sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).limit(limit).all()
        items = []
        for session in sessions:
            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.session_id == session.session_id)
                .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
                .all()
            )
            if query and not any(query in message.content.lower() for message in messages):
                continue
            preview = next((message.content for message in messages if message.role == "user"), "")
            items.append(
                {
                    "session_id": session.session_id,
                    "title": session.title,
                    "message_count": len(messages),
                    "preview": preview[:140],
                    "updated_at": session.updated_at.isoformat() if session.updated_at else None,
                }
            )
        return jsonify({"items": items})
    finally:
        db.close()


@app.route("/api/history/<session_id>", methods=["GET"])
def history_detail(session_id: str):
    """Retorna o histórico completo e ordenado de mensagens de uma sessão específica.

    Args:
        session_id: Identificador único da sessão.

    Returns:
        JSON com session_id, title, timestamps e array de mensagens.
    """
    db = SessionLocal()
    try:
        session = db.get(ChatSession, session_id)
        if session is None:
            return jsonify({"error": "Session not found"}), 404
        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
            .all()
        )
        return jsonify(
            {
                "session_id": session.session_id,
                "title": session.title,
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "updated_at": session.updated_at.isoformat() if session.updated_at else None,
                "messages": [_serialize_message(message) for message in messages],
            }
        )
    finally:
        db.close()


@app.route("/api/history/<session_id>", methods=["DELETE"])
def history_delete(session_id: str):
    """Exclui permanentemente uma sessão de conversa e todas as mensagens associadas.

    Args:
        session_id: Identificador da conversa a ser excluída.

    Returns:
        JSON com status 'deleted' e session_id.
    """
    db = SessionLocal()
    try:
        session = db.get(ChatSession, session_id)
        if session is None:
            return jsonify({"error": "Session not found"}), 404
        db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
        db.delete(session)
        db.commit()
        return jsonify({"status": "deleted", "session_id": session_id})
    except Exception as exc:
        db.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        db.close()


@app.route("/api/visit", methods=["POST"])
def record_visit():
    """Registra uma visita anônima para telemetria de audiência com IP anonimizado por hash.

    Returns:
        JSON com status 'recorded' e ID do registro.
    """
    data = request.get_json(silent=True) or {}
    endpoint = str(data.get("endpoint") or "/")[:128]
    referrer = str(data.get("referrer") or request.referrer or "")[:256] or None
    user_agent = str(data.get("userAgent") or request.headers.get("User-Agent") or "")[:512]

    # IP anonimizado para contagem segura de visitantes únicos
    raw_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
    ip_first = raw_ip.split(",")[0].strip()
    ip_hash = hashlib.sha256(f"kae_{ip_first}".encode("utf-8")).hexdigest()[:16]

    db = SessionLocal()
    try:
        visit = Visit(ip_hash=ip_hash, user_agent=user_agent, endpoint=endpoint, referrer=referrer)
        db.add(visit)
        db.commit()
        return jsonify({"status": "recorded", "id": visit.id}), 201
    except Exception as exc:
        db.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        db.close()


@app.route("/api/visits", methods=["GET"])
def get_visits():
    """Retorna métricas consolidadas de visitas (totais, únicos, diários e lista recente).

    Returns:
        JSON com total_visits, unique_visitors, today_visits e recent.
    """
    limit = min(max(int(request.args.get("limit", 50)), 1), 100)
    db = SessionLocal()
    try:
        total_visits = db.query(func.count(Visit.id)).scalar() or 0
        unique_visitors = db.query(func.count(func.distinct(Visit.ip_hash))).scalar() or 0

        now = datetime.now(UTC)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=UTC)
        today_visits = db.query(func.count(Visit.id)).filter(Visit.created_at >= start_of_today).scalar() or 0

        recent_rows = db.query(Visit).order_by(Visit.created_at.desc(), Visit.id.desc()).limit(limit).all()
        recent = [
            {
                "id": row.id,
                "ip_hash": row.ip_hash,
                "user_agent": row.user_agent,
                "endpoint": row.endpoint,
                "referrer": row.referrer,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in recent_rows
        ]
        return jsonify(
            {
                "total_visits": total_visits,
                "unique_visitors": unique_visitors,
                "today_visits": today_visits,
                "recent": recent,
            }
        )
    finally:
        db.close()


@app.route("/api/insights", methods=["GET"])
def insights():
    """Retorna visão geral executiva do sistema para o painel de auditoria (PIN 2506).

    Inclui contadores de sessões, mensagens, visitas, perfis, memórias e estado do RAG.

    Returns:
        JSON com os indicadores operacionais da Kaelara.
    """
    db = SessionLocal()
    try:
        total_sessions = db.query(func.count(ChatSession.session_id)).scalar() or 0
        total_messages = db.query(func.count(ChatMessage.id)).scalar() or 0
        last_message = db.query(ChatMessage).order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc()).first()

        total_visits = db.query(func.count(Visit.id)).scalar() or 0
        unique_visitors = db.query(func.count(func.distinct(Visit.ip_hash))).scalar() or 0
        now = datetime.now(UTC)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=UTC)
        today_visits = db.query(func.count(Visit.id)).filter(Visit.created_at >= start_of_today).scalar() or 0

        total_memories = db.query(func.count(MemoryItem.id)).scalar() or 0
        total_profiles = db.query(func.count(UserProfile.id)).scalar() or 0
        rag_info = get_knowledge_status()

        return jsonify(
            {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "total_visits": total_visits,
                "unique_visitors": unique_visitors,
                "today_visits": today_visits,
                "total_memories": total_memories,
                "total_profiles": total_profiles,
                "rag_info": rag_info,
                "last_provider": last_message.provider if last_message else None,
                "audio_available": audio is not None,
                "vision_available": vision is not None,
                "media_ttl": MEDIA_TTL,
            }
        )
    finally:
        db.close()


@app.route("/api/profiles", methods=["GET"])
def get_profiles():
    """Retorna a listagem de perfis de usuários identificados e cadastrados no sistema.

    Returns:
        JSON com total de perfis e array detalhado de cada usuário.
    """
    db = SessionLocal()
    try:
        profiles = db.query(UserProfile).order_by(desc(UserProfile.updated_at)).all()
        return jsonify({
            "total": len(profiles),
            "items": [
                {
                    "id": p.id,
                    "username": p.username,
                    "display_name": p.display_name,
                    "current_session_id": p.current_session_id,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                }
                for p in profiles
            ]
        })
    finally:
        db.close()


@app.route("/api/memory", methods=["GET"])
def get_memory():
    """Retorna as unidades de memória de longo prazo persistidas no banco.

    Returns:
        JSON com total de memórias e array de itens cognitivos.
    """
    db = SessionLocal()
    try:
        memories = db.query(MemoryItem).order_by(MemoryItem.id.asc()).all()
        return jsonify({
            "total": len(memories),
            "items": [
                {
                    "id": m.id,
                    "key": m.key,
                    "value": m.value,
                    "category": m.category,
                    "user_id": m.user_id,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in memories
            ]
        })
    finally:
        db.close()


@app.route("/api/rag/status", methods=["GET"])
def rag_status():
    """Retorna o status detalhado da base de conhecimento RAG e módulos disponíveis."""
    status = get_knowledge_status()
    return jsonify(status)


@app.route("/api/rag/search", methods=["GET"])
def rag_search():
    """Executa busca textual ou semântica direta na base de conhecimento especializada.

    Query params:
        q (str): Texto da pesquisa.
        limit (int): Número máximo de fragmentos relevantes (default: 5).

    Returns:
        JSON contendo query e array de resultados ranqueados por score.
    """
    q = (request.args.get("q") or "").strip()
    limit = min(max(int(request.args.get("limit", 5)), 1), 20)
    results = search_knowledge(q, top_k=limit)
    return jsonify({"query": q, "results": results})


@app.route("/api/vision", methods=["POST"])
def vision_endpoint():
    """Endpoint de processamento de visão computacional (captura de frame ou detecção facial).

    Payload:
        action (str): 'capture' para foto da webcam ou 'detect' para reconhecimento facial.

    Returns:
        JSON com frame_path ou array de faces detectadas.
    """
    if vision is None:
        return jsonify({"error": "Vision support not available. Install opencv-python-headless and face_recognition."}), 400

    action = (request.get_json(silent=True) or {}).get("action")
    if action == "capture":
        frame_path = vision.capture_frame()
        return jsonify({"frame_path": frame_path})
    if action == "detect":
        faces = vision.detect_faces()
        return jsonify({"faces": faces})
    return jsonify({"error": "Invalid action"}), 400


@app.route("/api/audio", methods=["POST"])
def audio_endpoint():
    """Endpoint de processamento de áudio (escuta via microfone ou síntese vocal TTS).

    Payload:
        action (str): 'listen' para capturar voz ou 'speak' para falar o texto enviado em 'text'.

    Returns:
        JSON com transcrição ou status de reprodução sonora.
    """
    if audio is None:
        return jsonify({"error": "Audio support not available"}), 400

    payload = request.get_json(silent=True) or {}
    action = payload.get("action")
    if action == "listen":
        text = audio.listen()
        return jsonify({"transcript": text})
    if action == "speak":
        text = payload.get("text", "")
        audio.speak(text)
        return jsonify({"status": "spoken"})
    return jsonify({"error": "Invalid action"}), 400


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint para monitoramento de liveness e readiness de serviços em nuvem."""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    if os.name == "nt":
        from waitress import serve

        serve(app, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
    else:
        from gunicorn.app.wsgiapp import run

        run()
