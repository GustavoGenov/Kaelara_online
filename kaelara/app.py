"""
Flask application entry point for Kaelara AI (Cloud Version).
Fornece endpoints REST profissionais para chat, visão e áudio.
"""
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Carrega as variáveis de ambiente com segurança
load_dotenv()

# Importações do banco de dados e do motor RAG do Google
from .database import SessionLocal, engine, Base
from .rag import RAGEngine

# Inicializa a aplicação Flask
app = Flask(__name__)

# Cria as tabelas do banco de dados se não existirem
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[Aviso] Banco de dados não inicializado: {e}")

# Inicializa o Motor de IA (Kaelara)
try:
    rag = RAGEngine()
except Exception as e:
    print(f"[Erro Crítico] Falha ao ligar o cérebro da Kaelara: {e}")
    rag = None


@app.route('/api/chat', methods=['POST'])
def chat():
    """ Endpoint principal de comunicação com a IA """
    data = request.json or {}
    user_msg = data.get('message', '').strip()

    if not user_msg:
        return jsonify({'error': 'A mensagem não pode estar vazia.'}), 400

    if not rag:
        return jsonify({'error': 'O motor da IA está offline no momento.'}), 500

    try:
        # Envia a mensagem para a API do Google (RAG)
        answer = rag.gerar_resposta(user_msg)
        return jsonify({'answer': answer}), 200
    except Exception as e:
        return jsonify({'error': f'Erro interno da IA: {str(e)}'}), 500


@app.route('/api/vision', methods=['POST'])
def vision_endpoint():
    """ 
    Endpoint preparado para a Nuvem. 
    O frontend (navegador) é quem deve capturar a foto da webcam e enviar para cá.
    """
    return jsonify({
        'status': 'nuvem',
        'info': 'Para usar a visão, o frontend deve enviar o arquivo de imagem via upload para este endpoint.'
    }), 200


@app.route('/api/audio', methods=['POST'])
def audio_endpoint():
    """ 
    Endpoint preparado para a Nuvem. 
    O frontend (navegador) deve usar a Web Speech API para ouvir o usuário, ou enviar um arquivo de áudio.
    """
    return jsonify({
        'status': 'nuvem',
        'info': 'Para usar áudio, processe o microfone no frontend e envie o texto ou o arquivo .wav para cá.'
    }), 200


@app.route('/health', methods=['GET'])
def health():
    """ Rota de verificação para a Render saber que o servidor está vivo """
    return jsonify({'status': 'ok', 'environment': 'cloud'}), 200


if __name__ == '__main__':
    # Bloco executado apenas em testes locais no PC
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
