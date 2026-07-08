import os
from google import genai
from dotenv import load_dotenv

# Carrega do .env se for local, mas na Render usa a nuvem
load_dotenv()

# Load Gemini API key from environment (via config)
from .config import GEMINI_API_KEY, GEMINI_MODEL_NAME

if not GEMINI_API_KEY:
    raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada! Verifique o painel da Render.")

client = genai.Client(api_key=GEMINI_API_KEY)

# Load Gemini API key and model name from configuration


class RAGEngine:
    def __init__(self):
        """
        Inicializa o motor da Kaelara usando a API oficial e atualizada do Google.
        """
        self.model_name = "gemini-1.5-flash"
        print(f"[*] Kaelara RAG inicializado com o modelo de nuvem: {self.model_name}")

    def gerar_resposta(self, mensagem_usuario: str, contexto_rag: str = "") -> str:
        prompt_sistema = (
            "Você é a Kaelara, uma inteligência artificial assistente altamente avançada e profissional.\n"
            "Use as informações do contexto fornecido abaixo para responder de forma precisa e contextualizada ao usuário.\n"
            "Se o contexto não contiver a resposta, use sua base de conhecimento mantendo a sua personalidade.\n\n"
            f"--- CONTEXTO DE MEMÓRIA (RAG) ---\n{contexto_rag}\n---------------------------------\n"
        )

        prompt_final = f"{prompt_sistema}\nUsuário: {mensagem_usuario}\nKaelara:"

        try:
            # Requerimento usando a biblioteca nova (google-genai)
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt_final,
            )
            return response.text
        except Exception as e:
            print(f"[!] Erro ao chamar a API do Google: {e}")
            return "Desculpe, tive um problema temporário ao processar minha linha de pensamento na nuvem."
