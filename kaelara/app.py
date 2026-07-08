# kaelara/app.py
"""Flask application entry point for Kaelara AI.
Provides REST endpoints for chat, vision, audio, and utility operations.
"""
import os
from flask import Flask, request, jsonify
from .config import REDIS_URL, DATABASE_URL, MEDIA_TTL
from .database import SessionLocal, engine, Base
from .cache import Cache
from .rag import RAGEngine

try:
    from .vision import Vision
except ImportError:
    Vision = None
    print("[Aviso] Módulo de visão não encontrado. Continuando sem suporte a visão local.")

try:
    from .audio import Audio
except ImportError:
    Audio = None
    print("[Aviso] Módulo de áudio não encontrado. Continuando sem suporte a voz.")
# Initialize Flask app
app = Flask(__name__)

# Create DB tables if not exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Aviso] Banco de dados não inicializado: {e}")

# Initialise shared components
cache = Cache(redis_url=REDIS_URL)
rag = RAGEngine(cache=cache)
if Vision is not None:
    vision = Vision()
else:
    vision = None

if Audio is not None:
    audio = Audio()
else:
    audio = None

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_msg = data.get('message', '')
    if not user_msg:
        return jsonify({'error': 'Empty message'}), 400
    # Use RAG to generate answer
    answer = rag.ask(user_msg)
    return jsonify({'answer': answer})

@app.route('/api/vision', methods=['POST'])
def vision_endpoint():
    if vision is None:
        return jsonify({'error': 'Vision support not available. Install opencv-python-headless and face_recognition.'}), 400
    # Expected: JSON with "action": "capture" or "detect"
    action = request.json.get('action')
    if action == 'capture':
        frame_path = vision.capture_frame()
        return jsonify({'frame_path': frame_path})
    elif action == 'detect':
        faces = vision.detect_faces()
        return jsonify({'faces': faces})
    else:
        return jsonify({'error': 'Invalid action'}), 400

@app.route('/api/audio', methods=['POST'])
def audio_endpoint():
    if Audio is None:
        return jsonify({'error': 'Audio support not available'}), 400
    action = request.json.get('action')
    if action == 'listen':
        text = audio.listen()
        return jsonify({'transcript': text})
    elif action == 'speak':
        text = request.json.get('text', '')
        audio.speak(text)
        return jsonify({'status': 'spoken'})
    else:
        return jsonify({'error': 'Invalid action'}), 400

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    # Local development fallback – use waitress on Windows, gunicorn on Linux
    if os.name == 'nt':
        from waitress import serve
        serve(app, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
    else:
        from gunicorn.app.wsgiapp import run
        run()
