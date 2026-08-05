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
