# kaelara/audio.py
"""Módulo de Áudio e Voz da Kaelara A.I.

Implementa capacidades de escuta (Speech-to-Text) com cancelamento de ruído e transcrição
via PocketSphinx (modo offline) e Google Web Speech (modo online).
Implementa também síntese de fala (Text-to-Speech) offline e multiplataforma com pyttsx3.
Os arquivos de áudio temporários são gerados com UUID e limpos automaticamente pelo TTL.
"""

import os
import subprocess
import time
import uuid
from pathlib import Path

import pyttsx3
import speech_recognition as sr

from .cache import Cache
from .config import MEDIA_TTL

# Diretório temporário para gravações e renderizações de áudio
BASE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = BASE_DIR / "media" / "temp"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


class Audio:
    """Controlador de recursos de voz (STT e TTS) da Kaelara."""

    def __init__(self):
        """Inicializa o motor de síntese de fala (pyttsx3) e o cache de mídias."""
        self.cache = Cache()
        self.tts_engine = pyttsx3.init()
        # Ajusta propriedades da voz (velocidade e volume)
        self.tts_engine.setProperty("rate", 170)
        self.tts_engine.setProperty("volume", 1.0)

    def _cleanup_expired(self):
        """Remove arquivos de áudio temporários cujo tempo de modificação ultrapassou o MEDIA_TTL."""
        now = time.time()
        for file in list(AUDIO_DIR.iterdir()):
            try:
                mtime = file.stat().st_mtime
                if now - mtime > MEDIA_TTL:
                    file.unlink()
            except Exception:
                continue

    def listen(self, timeout: int = 5, phrase_time_limit: int = 10) -> str:
        """Captura áudio do microfone padrão e retorna o texto transcrito.

        Aplica ajuste de ruído ambiente, tenta reconhecimento offline via PocketSphinx
        e realiza fallback para a Google Web Speech API quando conectado à internet.

        Args:
            timeout: Tempo limite em segundos aguardando o início da fala.
            phrase_time_limit: Duração máxima da frase gravada em segundos.

        Returns:
            String contendo a transcrição do áudio capturado.
        """
        self._cleanup_expired()
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source)
            audio_data = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)

        # Tenta motor offline primeiro
        try:
            transcript = recognizer.recognize_sphinx(audio_data)
        except sr.RequestError:
            # Sem motor PocketSphinx – fallback para Google Web Speech
            try:
                transcript = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                transcript = ""

        # Salva áudio WAV bruto para fins de auditoria ou reprodução
        wav_path = AUDIO_DIR / f"audio_{uuid.uuid4().hex}.wav"
        with open(wav_path, "wb") as f:
            f.write(audio_data.get_wav_data())
        self.cache.set(key=f"audio:{wav_path.name}", value=str(wav_path), ttl=MEDIA_TTL)
        return transcript

    def speak(self, text: str) -> None:
        """Converte texto em fala audível e executa no dispositivo de som padrão.

        Gera um arquivo WAV temporário que é reproduzido pelo player nativo do SO
        e registrado no cache para expiração controlada por TTL.

        Args:
            text: Conteúdo textual a ser falado pela Kaelara.
        """
        self._cleanup_expired()
        wav_path = AUDIO_DIR / f"tts_{uuid.uuid4().hex}.wav"
        self.tts_engine.save_to_file(text, str(wav_path))
        self.tts_engine.runAndWait()

        # Execução de áudio nativa por sistema operacional
        if os.name == "nt":
            os.startfile(str(wav_path))
        else:
            subprocess.Popen(["ffplay", "-nodisp", "-autoexit", str(wav_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.cache.set(key=f"tts:{wav_path.name}", value=str(wav_path), ttl=MEDIA_TTL)
