"""Flask application entry point for Kaelara AI."""

from __future__ import annotations

import os
from datetime import UTC, datetime
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import desc, func

from .cache import Cache
from .config import MEDIA_TTL, REDIS_URL
from .database import ChatMessage, ChatSession, SessionLocal, init_db
from .rag import RAGEngine

try:
    from .vision import Vision
except ImportError:  # pragma: no cover - optional dependency path
    Vision = None

try:
    from .audio import Audio
except ImportError:  # pragma: no cover - optional dependency path
    Audio = None


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
    title = " ".join(message.strip().split())
    return (title[:57] + "...") if len(title) > 60 else (title or "Nova conversa")


def _serialize_message(message: ChatMessage) -> dict[str, str]:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "provider": message.provider,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def _get_or_create_session(db, session_id: str | None, first_message: str) -> ChatSession:
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
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(desc(ChatMessage.id))
        .limit(limit)
        .all()
    )
    rows.reverse()
    return [{"role": row.role, "content": row.content} for row in rows]


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_msg = (data.get("message") or "").strip()
    if not user_msg:
        return jsonify({"error": "Empty message"}), 400

    db = SessionLocal()
    try:
        session = _get_or_create_session(db, data.get("session_id"), user_msg)
        history = _recent_history(db, session.session_id)
        db.add(ChatMessage(session_id=session.session_id, role="user", content=user_msg, provider="client"))
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
                "messages": [_serialize_message(message) for message in messages],
            }
        )
    except Exception as exc:
        db.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        db.close()


@app.route("/api/history", methods=["GET"])
def history():
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


@app.route("/api/insights", methods=["GET"])
def insights():
    db = SessionLocal()
    try:
        total_sessions = db.query(func.count(ChatSession.session_id)).scalar() or 0
        total_messages = db.query(func.count(ChatMessage.id)).scalar() or 0
        last_message = db.query(ChatMessage).order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc()).first()
        return jsonify(
            {
                "total_sessions": total_sessions,
                "total_messages": total_messages,
                "last_provider": last_message.provider if last_message else None,
                "audio_available": audio is not None,
                "vision_available": vision is not None,
                "media_ttl": MEDIA_TTL,
            }
        )
    finally:
        db.close()


@app.route("/api/vision", methods=["POST"])
def vision_endpoint():
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
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    if os.name == "nt":
        from waitress import serve

        serve(app, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
    else:
        from gunicorn.app.wsgiapp import run

        run()
