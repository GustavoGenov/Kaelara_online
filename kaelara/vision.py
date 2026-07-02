# kaelara/vision.py
"""Vision utilities.
- `capture_frame()` grabs a single frame from the default webcam (OpenCV) and stores it in a temporary folder.
- `detect_faces()` runs face detection + encoding via the `face_recognition` library.
Both functions are **on‑demand**; they are only imported/used when the corresponding endpoint is called.
Media files are written to `kaelara/media/temp/` and scheduled for deletion after 24 h by the cleanup task.
"""
import os
import uuid
import cv2
import numpy as np
try:
    import face_recognition
except ImportError:
    face_recognition = None
    print("[Aviso] Biblioteca 'face_recognition' desativada. Rodando em modo nuvem.")
from pathlib import Path
from datetime import datetime, timedelta

from .config import MEDIA_TTL
from .cache import Cache

# Ensure temp directory exists
BASE_DIR = Path(__file__).resolve().parents[1]
TEMP_DIR = BASE_DIR / "media" / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

class Vision:
    def __init__(self):
        # Simple in‑memory cache for recent frames (key -> path)
        self.cache = Cache()

    def _cleanup_expired(self):
        """Remove files older than MEDIA_TTL seconds.
        This is called before each operation to keep the folder tidy.
        """
        now = datetime.utcnow()
        for file in list(TEMP_DIR.iterdir()):
            try:
                mtime = datetime.utcfromtimestamp(file.stat().st_mtime)
                if (now - mtime).total_seconds() > MEDIA_TTL:
                    file.unlink()
            except Exception:
                continue

    def capture_frame(self) -> str:
        """Capture a single webcam frame and return the absolute path.
        The image is saved as a JPEG with a random UUID filename.
        """
        self._cleanup_expired()
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise RuntimeError("Unable to access the webcam")
        ret, frame = cap.read()
        cap.release()
        if not ret:
            raise RuntimeError("Failed to read frame from webcam")
        filename = f"frame_{uuid.uuid4().hex}.jpg"
        path = TEMP_DIR / filename
        cv2.imwrite(str(path), frame)
        # Cache path for quick lookup (optional)
        self.cache.set(key=f"frame:{filename}", value=str(path), ttl=MEDIA_TTL)
        return str(path)

    def detect_faces(self, frame_path: str = None) -> list:
        """Detect faces in a given image.
        If `frame_path` is omitted, a fresh frame is captured.
        Returns a list of dictionaries with bounding box and encoding (base64 string).
        """
        self._cleanup_expired()
        if not frame_path:
            frame_path = self.capture_frame()
        image = cv2.imread(frame_path)
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        # Detect face locations and encodings
        locations = face_recognition.face_locations(rgb)
        encodings = face_recognition.face_encodings(rgb, locations)
        results = []
        for (top, right, bottom, left), enc in zip(locations, encodings):
            results.append({
                "box": {"top": top, "right": right, "bottom": bottom, "left": left},
                "encoding": enc.tolist(),
            })
        return results
