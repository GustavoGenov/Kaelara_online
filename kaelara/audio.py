# kaelara/audio.py
"""Audio utilities.
- `listen()` captures microphone audio, performs speech‑to‑text using **SpeechRecognition** (pocketsphinx fallback).
- `speak(text)` converts text to speech with **pyttsx3** (offline, cross‑platform).
Both functions are **on‑demand**; they are only used when the `/api/audio` endpoint is called.
Media files are temporary and will be removed by the cache cleanup (TTL 24 h).
"""
import os
import time
import uuid
import json
from pathlib import Path
import subprocess

import speech_recognition as sr
import pyttsx3

from .config import MEDIA_TTL
from .cache import Cache

# Temporary directory for audio recordings
BASE_DIR = Path(__file__).resolve().parents[1]
AUDIO_DIR = BASE_DIR / "media" / "temp"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

class Audio:
    def __init__(self):
        self.cache = Cache()
        self.tts_engine = pyttsx3.init()
        # Adjust voice properties (optional)
        self.tts_engine.setProperty('rate', 170)
        self.tts_engine.setProperty('volume', 1.0)

    def _cleanup_expired(self):
        now = time.time()
        for file in list(AUDIO_DIR.iterdir()):
            try:
                mtime = file.stat().st_mtime
                if now - mtime > MEDIA_TTL:
                    file.unlink()
            except Exception:
                continue

    def listen(self, timeout: int = 5, phrase_time_limit: int = 10) -> str:
        """Capture audio from the default microphone and return a transcription.
        Uses PocketSphinx (offline) if internet is unavailable; otherwise falls back to Google Web Speech.
        """
        self._cleanup_expired()
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source)
            audio_data = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
        # Try offline recognizer first
        try:
            transcript = recognizer.recognize_sphinx(audio_data)
        except sr.RequestError:
            # No PocketSphinx engine – fallback to Google (requires internet)
            try:
                transcript = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                transcript = ""
        # Save raw audio (wav) for possible audit – TTL ensures deletion after 24 h
        wav_path = AUDIO_DIR / f"audio_{uuid.uuid4().hex}.wav"
        with open(wav_path, "wb") as f:
            f.write(audio_data.get_wav_data())
        self.cache.set(key=f"audio:{wav_path.name}", value=str(wav_path), ttl=MEDIA_TTL)
        return transcript

    def speak(self, text: str) -> None:
        """Convert *text* to speech and play it through the default speaker.
        The generated audio file is stored temporarily and removed after the TTL.
        """
        self._cleanup_expired()
        # Generate temporary wav file using pyttsx3 (engine saves to file)
        wav_path = AUDIO_DIR / f"tts_{uuid.uuid4().hex}.wav"
        self.tts_engine.save_to_file(text, str(wav_path))
        self.tts_engine.runAndWait()
        # Play the file (cross‑platform) – use `ffplay` if available, else default OS player
        if os.name == "nt":
            os.startfile(str(wav_path))
        else:
            subprocess.Popen(["ffplay", "-nodisp", "-autoexit", str(wav_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.cache.set(key=f"tts:{wav_path.name}", value=str(wav_path), ttl=MEDIA_TTL)
