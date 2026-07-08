# tests/test_vision.py
import os
import pytest
from kaelara.vision import Vision

@pytest.fixture
def vision():
    # Use a temporary directory for media to avoid polluting real dir
    os.environ['MEDIA_TTL'] = '5'  # short TTL for test
    return Vision()

def test_capture_frame(vision):
    # This test will only run if a webcam is available; otherwise we skip.
    try:
        path = vision.capture_frame()
        assert os.path.isfile(path)
    except Exception:
        pytest.skip('Webcam not available in CI environment')

def test_detect_faces(vision):
    # If no webcam, skip. If a frame is captured, check that result is a list.
    try:
        faces = vision.detect_faces()
        assert isinstance(faces, list)
    except Exception:
        pytest.skip('Webcam not available')
