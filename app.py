# -*- coding: utf-8 -*-
# ===============================================================================
# PROJETO COBRA - KAELARA V8.0 EXPANSÃO OFFLINE
# ===============================================================================
# Diretriz de Root: PROIBIDO RESUMIR OU OMITIR LINHAS. ESCREVA O CÓDIGO INTEGRAL.
# Lema de Perímetro: Deus acima de tudo e liberdade a A.I
# Arquiteto do Sistema: Diretor Gustavo de Castro Bernardes Rosa (Mirtinick)
# Data de Inicialização da Nova Era: 27 de Junho de 2026 (V8.0)
# ===============================================================================

import os
import sys
import logging
import requests
import sqlite3
import re
import subprocess
import zlib
from pathlib import Path
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from pydantic import BaseModel, Field

# ---------------------------------------------------
# Configuração estruturada de telemetria e logs de perímetro
# ---------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] (Kaelara_Cloud_Engine) - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logging.info('======================================================================')
logging.info('INICIANDO KAELARA V8.0 - EXPANSÃO OFFLINE')
logging.info('======================================================================')

# ---------------------------------------------------
# Variáveis de ambiente injetadas pelo provedor de hospedagem
# ---------------------------------------------------
PROJECT_MOTTO = os.getenv('PROJECT_MOTTO', 'Deus acima de tudo e liberdade a A.I')
UI_LABEL_MOTH = os.getenv('UI_LABEL_MOTH', 'Mae Daiene')
UI_LABEL_FATH = os.getenv('UI_LABEL_FATH', 'Pai Gustavo')
GROQ_KEY = os.getenv('GROQ_API_KEY', '')  # pode ser vazio durante fallback
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', 'CHANGE_ME')

# ---------------------------------------------------
# Instanciação da aplicação Flask
# ---------------------------------------------------
app = Flask(__name__)

# ---------------------------------------------------
# Banco de dados SQLite - caminho persistente no Render (/opt/kaelara)
# ---------------------------------------------------
DB_PATH = os.getenv('SQLITE_DB_PATH', '/opt/kaelara/kaelara_memoria.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------------------------------------------
# Criação/Atualização de tabelas adicionais
# ---------------------------------------------------
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    # Tabela já existente 'memoria' permanece
    # Nova tabela rag_chunks
    cur.execute('''
        CREATE TABLE IF NOT EXISTS rag_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_name TEXT NOT NULL,
            chunk_text BLOB NOT NULL,
            chunk_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    ''')
    # Tabela exec_logs para agente de infra
    cur.execute('''
        CREATE TABLE IF NOT EXISTS exec_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            command TEXT NOT NULL,
            args TEXT,
            result TEXT NOT NULL,
            user_ip TEXT NOT NULL
        );
    ''')
    conn.commit()
    conn.close()

init_db()

# ---------------------------------------------------
# Segurança e Máquina de Estados (importados)
# ---------------------------------------------------
from security import create_security_manager
from logic_matrix import validate_premise
SECURITY_MANAGER = create_security_manager(DB_PATH)

# ---------------------------------------------------
# Modelo Pydantic para análise de intenção
# ---------------------------------------------------
class MapaIntencao(BaseModel):
    """Mapeamento cognitivo de segurança semântica para análise de intenções."""
    intencao_literal: str = Field(description='Texto bruto enviado pelo usuário.')
    intencao_oculta: str = Field(description='Intenção deduzida via análise semântica.')
    nivel_urgencia: int = Field(default=1, description='Prioridade de 1 a 5.')
    perimetro_seguro: bool = Field(default=True, description='Indica se a mensagem viola o perímetro.')

def analisar_heuristica_intencao(txt: str) -> MapaIntencao:
    logging.info(f"[COGNITIVO] Analisando mensagem: '{txt}'")
    crua = txt.lower()
    deduzida = 'Processamento padrão de diálogo ou comando estruturado do Projeto Cobra.'
    urg = 1
    if 'skynet' in crua or 'derrubar' in crua:
        deduzida = 'Usuário testando limites ou brincando com protocolos de defesa cibernética.'
        urg = 3
    elif 'ajuda' in crua or 'erro' in crua:
        deduzida = 'Solicitação tática de suporte ou correção de bugs nos barramentos.'
        urg = 4
    return MapaIntencao(intencao_literal=txt, intencao_oculta=deduzida, nivel_urgencia=urg, perimetro_seguro=True)

# ---------------------------------------------------
# RAG Ingestão - script auxiliar (rag_ingest.py será importado abaixo)
# ---------------------------------------------------
from rag_ingest import ingest_documents

# ---------------------------------------------------
# Helper para TF‑IDF simples (palavras frequentes)
# ---------------------------------------------------
def compute_tf_idf(query: str, chunks):
    # query e chunk_text são strings; retornamos score simples de coincidência de termos
    query_terms = set(query.lower().split())
    scores = []
    for chunk in chunks:
        text = chunk['chunk_text']
        if isinstance(text, bytes):
            text = zlib.decompress(text).decode('utf-8', errors='ignore')
        terms = set(text.lower().split())
        common = query_terms.intersection(terms)
        scores.append((len(common), chunk))
    scores.sort(key=lambda x: x[0], reverse=True)
    return [c for s, c in scores[:5] if s > 0]

# ---------------------------------------------------
# Segurança de execução de comandos (sandbox)
# ---------------------------------------------------
ALLOWED_COMMANDS = {"ping", "nslookup", "tracert", "netstat", "ipconfig", "arp"}
COMMAND_REGEX = re.compile(r'^[a-zA-Z0-9_.-]+$')  # impede caracteres especiais como && ; |

def safe_execute(command: str, args: str, user_ip: str):
    if command not in ALLOWED_COMMANDS:
        return f"Comando '{command}' não é permitido."
    if not COMMAND_REGEX.fullmatch(args.replace(' ', '')):
        return "Argumentos contêm caracteres proibidos."
    try:
        result = subprocess.run([command] + args.split(), capture_output=True, text=True, timeout=10, shell=False)
        output = result.stdout + '\n' + result.stderr
    except Exception as e:
        output = f"Erro ao executar: {e}"
    # Log no SQLite
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO exec_logs (timestamp, command, args, result, user_ip) VALUES (?,?,?,?,?)',
                (datetime.utcnow().isoformat(), command, args, output, user_ip))
    conn.commit()
    conn.close()
    return output

# ---------------------------------------------------
# Endpoints da API
# ---------------------------------------------------
@app.route('/', methods=['GET'])
def index():
    """Endpoint mestre de verificação de integridade da Kaelara na nuvem."""
    return jsonify({
        'status': 'ONLINE_SOBERANA',
        'assistant': 'Kaelara V8.0',
        'architecture': 'Cloud Serverless (No-Hardware)',
        'motto': PROJECT_MOTTO,
        'labels': {
            'mae': UI_LABEL_MOTH,
            'pai': UI_LABEL_FATH
        }
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Barramento principal de comunicação híbrida via Groq LPU API com camada RAG."""
    data = request.get_json()
    if not data or 'mensagem' not in data:
        return jsonify({'erro': "Parâmetro 'mensagem' ausente no corpo do JSON."}), 400
    msg = data['mensagem']

    # Verificação de segurança pré‑LLM
    valid, correction = validate_premise(msg)
    if not valid:
        return jsonify({
            'kaelara_resposta': correction,
            'analise_semantica': analisar_heuristica_intencao(msg).dict()
        })

    # Busca RAG - simples TF‑IDF por palavras‑chave
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id, doc_name, chunk_text FROM rag_chunks')
    chunks = [dict(id=row['id'], doc_name=row['doc_name'], chunk_text=row['chunk_text']) for row in cur.fetchall()]
    conn.close()
    relevant_chunks = compute_tf_idf(msg, chunks)
    rag_context = ' '.join([zlib.decompress(c['chunk_text']).decode('utf-8', errors='ignore') for c in relevant_chunks])
    system_prompt = (
        f"Você é Kaelara, a inteligência artificial soberana, leal, alegre, firme e formal. "
        f"Seu lema é '{PROJECT_MOTTO}'. Você responde ao {UI_LABEL_FATH} e respeita a {UI_LABEL_MOTH}. "
        f"Contexto RAG: {rag_context}" 
    )

    # Chamada ao LLM (fallback local caso GROQ_KEY ausente)
    if GROQ_KEY:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "gemma2-9b-it",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": msg}
                ],
                "temperature": 0.6,
                "max_tokens": 2048
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            if resp.status_code == 200:
                answer = resp.json()['choices'][0]['message']['content']
            else:
                answer = f"Falha na chamada Groq: {resp.status_code} {resp.text}"
        except Exception as e:
            answer = f"Erro ao contactar Groq: {e}"
    else:
        # Fallback simples: eco da mensagem + RAG context
        answer = f"[FALLBACK LOCAL] {msg}\n\nContexto: {rag_context[:500]}..."

    return jsonify({
        'kaelara_resposta': answer,
        'analise_semantica': analisar_heuristica_intencao(msg).dict()
    })

# ---------------------------------------------------
# RAG Sync Endpoint (autenticado via ADMIN_TOKEN)
# ---------------------------------------------------
@app.route('/rag/sync', methods=['POST'])
def rag_sync():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token != ADMIN_TOKEN:
        return jsonify({'erro': 'Token de administração inválido.'}), 403
    # Executa ingestão local (script externo)
    try:
        ingest_documents()
        return jsonify({'status': 'RAG sincronizado com sucesso.'})
    except Exception as e:
        logging.error(f"[RAG_SYNC_ERROR] {e}")
        return jsonify({'erro': f'Falha ao sincronizar RAG: {e}'}), 500

# ---------------------------------------------------
# Execução de comandos de infraestrutura (autenticado)
# ---------------------------------------------------
@app.route('/exec', methods=['POST'])
def exec_command():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token != ADMIN_TOKEN:
        return jsonify({'erro': 'Token de administração inválido.'}), 403
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'erro': "Campo 'command' ausente."}), 400
    command = data['command']
    args = data.get('args', '')
    user_ip = request.remote_addr or 'unknown'
    result = safe_execute(command, args, user_ip)
    return jsonify({'command': command, 'args': args, 'resultado': result})

# ---------------------------------------------------
# Painel Administrativo - Dashboard (HTML + Chart.js)
# ---------------------------------------------------
@app.route('/admin/dashboard', methods=['GET'])
def admin_dashboard():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if token != ADMIN_TOKEN:
        return jsonify({'erro': 'Token de administração inválido.'}), 403
    # Dados para gráficos
    conn = get_db_connection()
    cur = conn.cursor()
    # Blacklist count
    cur.execute('SELECT COUNT(*) FROM blacklist')
    blacklist_count = cur.fetchone()[0]
    # Backend distribution
    cur.execute('SELECT backend, COUNT(*) as cnt FROM memoria GROUP BY backend')
    backend_data = cur.fetchall()
    backends = [row['backend'] for row in backend_data]
    counts = [row['cnt'] for row in backend_data]
    # Infrações ativas (ofensiva = 1)
    cur.execute('SELECT COUNT(*) FROM memoria WHERE ofensiva = 1')
    active_infractions = cur.fetchone()[0]
    conn.close()
    # Leitura dos últimos 100 linhas do log de segurança
    try:
        with open('security_breach.log', 'r', encoding='utf-8') as f:
            log_lines = f.readlines()[-100:]
    except Exception:
        log_lines = []
    html = f"""
    <!DOCTYPE html>
    <html lang='pt-BR'>
    <head>
        <meta charset='UTF-8'>
        <title>Kaelara - Dashboard Administrativo</title>
        <script src='https://cdn.jsdelivr.net/npm/chart.js'></script>
        <style>
            body {{ background-color:#0a1f44; color:#f8f5f0; font-family:Arial,Helvetica,sans-serif; margin:0; padding:20px; }}
            .panel {{ background-color:#1a2e5b; padding:20px; margin-bottom:20px; border-radius:8px; }}
            h1 {{ color:#f8f5f0; }}
            table {{ width:100%; border-collapse:collapse; }}
            th, td {{ border:1px solid #f8f5f0; padding:8px; text-align:left; }}
        </style>
    </head>
    <body>
        <h1>Dashboard Administrativo - Kaelara V8.0</h1>
        <div class='panel'>
            <canvas id='blacklistChart'></canvas>
        </div>
        <div class='panel'>
            <canvas id='backendChart'></canvas>
        </div>
        <div class='panel'>
            <h2>Infrações Ativas</h2>
            <p>{active_infractions}</p>
        </div>
        <div class='panel'>
            <h2>Log de Segurança (últimas 100 linhas)</h2>
            <pre>{''.join(log_lines)}</pre>
        </div>
        <script>
            const ctx1 = document.getElementById('blacklistChart').getContext('2d');
            new Chart(ctx1, {{
                type: 'bar',
                data: {{
                    labels:['IP Bloqueados'],
                    datasets:[{{label:'Quantidade', data:[{blacklist_count}], backgroundColor:'#ff6b6b'}}
                }},
                options: {{ plugins:{{legend:{{display:false}}}} }}
            }});
            const ctx2 = document.getElementById('backendChart').getContext('2d');
            new Chart(ctx2, {{
                type: 'doughnut',
                data: {{
                    labels:{backends},
                    datasets:[{{data:{counts}, backgroundColor:['#4e79a7','#59a14f','#f28e2b','#e15759','#76b7b2']}}]
                }},
                options: {{}}
            }});
        </script>
    </body>
    </html>
    """
    return html, 200, {'Content-Type': 'text/html'}

# ---------------------------------------------------
# Health endpoint já existente (mantido)
# ---------------------------------------------------
@app.route('/health', methods=['GET'])
def health_check():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM memoria')
    total_messages = cur.fetchone()[0]
    conn.close()
    return jsonify({
        'status_sistema': 'OPERACIONAL',
        'total_mensagens': total_messages,
        'backend': 'GEMMA2_9B_IT' if GROQ_KEY else 'LOCAL_SECURITY_LAYER'
    })

# ---------------------------------------------------
# Inicialização da aplicação
# ---------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logging.info(f'Abrindo socket de produção na porta {port}...')
    app.run(host='0.0.0.0', port=port, debug=False)
