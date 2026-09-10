# tests/test_app.py
import pytest
from kaelara.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.json == {'status': 'ok'}


def test_history_endpoints(client, monkeypatch):
    class DummyRag:
        def ask(self, message, history=None):
            assert message == 'teste de memoria'
            assert isinstance(history, list)
            return ('resposta simulada', 'test-provider')

    monkeypatch.setattr('kaelara.app.rag', DummyRag())

    chat_resp = client.post('/api/chat', json={'message': 'teste de memoria'})
    assert chat_resp.status_code == 200
    chat_data = chat_resp.get_json()
    assert chat_data['answer'] == 'resposta simulada'
    assert chat_data['provider'] == 'test-provider'
    assert chat_data['session_id']

    list_resp = client.get('/api/history')
    assert list_resp.status_code == 200
    list_data = list_resp.get_json()
    assert len(list_data['items']) >= 1

    detail_resp = client.get(f"/api/history/{chat_data['session_id']}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.get_json()
    assert [message['role'] for message in detail_data['messages']] == ['user', 'assistant']


def test_chat_stream(client, monkeypatch):
    class DummyRag:
        def ask_stream(self, message, history=None, image_base64=None):
            yield ("Olá ", "gemini")
            yield ("mundo!", "gemini")

    monkeypatch.setattr('kaelara.app.rag', DummyRag())

    resp = client.post('/api/chat/stream', json={'message': 'teste streaming'})
    assert resp.status_code == 200
    assert 'text/event-stream' in resp.headers.get('Content-Type', '')
    body = resp.get_data(as_text=True)
    assert 'Olá ' in body
    assert 'mundo!' in body
    assert '"type": "done"' in body


def test_chat_with_image(client, monkeypatch):
    called_with_image = []

    class DummyRag:
        def ask(self, message, history=None, image_base64=None):
            called_with_image.append(image_base64)
            return ('Vejo a imagem enviada!', 'gemini')

    monkeypatch.setattr('kaelara.app.rag', DummyRag())

    resp = client.post('/api/chat', json={'message': 'O que é isso?', 'image': 'data:image/jpeg;base64,dGVzdA=='})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['answer'] == 'Vejo a imagem enviada!'
    assert called_with_image == ['data:image/jpeg;base64,dGVzdA==']
