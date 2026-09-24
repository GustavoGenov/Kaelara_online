# kaelara/vision.py
"""Módulo de Visão Computacional da Kaelara A.I.

Implementa captura de quadros (frames) de webcam via OpenCV e detecção/codificação
facial via biblioteca `face_recognition`.
Os arquivos visuais são salvos temporariamente com nomes UUID em `media/temp/`
e removidos periodicamente com base na política de retenção (MEDIA_TTL).
"""

import os
import uuid
from datetime import UTC, datetime
from pathlib import Path

from .cache import Cache
from .config import MEDIA_TTL

# Garante a existência do diretório temporário para armazenamento de mídia visual
BASE_DIR = Path(__file__).resolve().parents[1]
TEMP_DIR = BASE_DIR / "media" / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)


class Vision:
    """Controlador de visão computacional, captura de webcam e análise facial da Kaelara."""

    def __init__(self):
        """Inicializa o subsistema de visão com cache de frames recentes."""
        self.cache = Cache()

    def _cleanup_expired(self):
        """Remove frames e capturas antigas cujo tempo de vida excedeu MEDIA_TTL segundos."""
        now = datetime.now(UTC)
        for file in list(TEMP_DIR.iterdir()):
            try:
                mtime = datetime.fromtimestamp(file.stat().st_mtime, tz=UTC)
                if (now - mtime).total_seconds() > MEDIA_TTL:
                    file.unlink()
            except Exception:
                continue

    def capture_frame(self) -> str:
        """Captura um único quadro da câmera/webcam padrão conectada e salva como JPEG.

        Returns:
            Caminho absoluto do arquivo de imagem gerado no disco.

        Raises:
            RuntimeError: Caso o OpenCV não esteja disponível ou a câmera não possa ser aberta.
        """
        self._cleanup_expired()
        try:
            import cv2
        except ImportError:
            raise RuntimeError("opencv-python não está instalado. Instale opencv-python para suporte à webcam.")

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise RuntimeError("Não foi possível acessar a webcam padrão.")
        ret, frame = cap.read()
        cap.release()
        if not ret:
            raise RuntimeError("Falha ao ler frame da webcam.")
        filename = f"frame_{uuid.uuid4().hex}.jpg"
        path = TEMP_DIR / filename
        cv2.imwrite(str(path), frame)
        # Registra o caminho no cache com TTL
        self.cache.set(key=f"frame:{filename}", value=str(path), ttl=MEDIA_TTL)
        return str(path)

    def detect_faces(self, frame_path: str = None) -> list:
        """Detecta rostos e extrai suas localizações e embeddings vetoriais de 128 dimensões.

        Args:
            frame_path: Caminho opcional para a imagem. Se omitido, captura um novo frame da webcam.

        Returns:
            Lista de dicionários contendo o bounding box ('box') e o vetor numérico ('encoding').

        Raises:
            RuntimeError: Caso as bibliotecas opencv-python ou face_recognition não estejam instaladas.
        """
        self._cleanup_expired()
        try:
            import cv2
            import face_recognition
        except ImportError:
            raise RuntimeError("face_recognition ou opencv-python não estão instalados.")

        if not frame_path:
            frame_path = self.capture_frame()
        image = cv2.imread(frame_path)
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        # Detecta localizações e encodings dos rostos presentes
        locations = face_recognition.face_locations(rgb)
        encodings = face_recognition.face_encodings(rgb, locations)
        results = []
        for (top, right, bottom, left), enc in zip(locations, encodings):
            results.append({
                "box": {"top": top, "right": right, "bottom": bottom, "left": left},
                "encoding": enc.tolist(),
            })
        return results
