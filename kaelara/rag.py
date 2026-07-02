import os
import google.generativeai as genai
from dotenv import load_dotenv

# Carrega as variáveis de ambiente (.env)
load_dotenv()

# Configura a API Key do Google AI Studio
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("ERRO: A variável GEMINI_API_KEY não foi encontrada no ambiente!")

genai.configure(api_key=GOOGLE_API_KEY)

class RAGEngine:
    def __init__(self):
        """
        Inicializa o motor da Kaelara usando a API oficial do Google.
        Modelos sugeridos: 
        - 'gemini-1.5-flash' (Recomendado para RAG devido ao contexto gigante de 1 milhão de tokens)
        - 'gemma2-9b-it' (Se você preferir manter estritamente a família Gemma)
        """
        # Usando o Gemini 1.5 Flash por ser otimizado para ler grandes volumes de dados (RAG)
        self.model_name = "gemini-1.5-flash"
        self.model = genai.GenerativeModel(self.model_name)
        print(f"[*] Kaelara RAG inicializado com o modelo de nuvem: {self.model_name}")

    def gerar_resposta(self, mensagem_usuario: str, contexto_rag: str = "") -> str:
        """
        Recebe a pergunta do usuário e os dados recuperados do banco PostgreSQL/Vetor (RAG)
        e gera uma resposta profissional consolidada.
        """
        # Criando a estrutura profissional do Prompt de Sistema + Contexto
        prompt_sistema = (
            "Você é a Kaelara, uma inteligência artificial assistente altamente avançada e profissional.\n"
            "Use as informações do contexto fornecido abaixo para responder de forma precisa e contextualizada ao usuário.\n"
            "Se o contexto não contiver a resposta, use sua base de conhecimento mantendo a sua personalidade.\n\n"
            f"--- CONTEXTO DE MEMÓRIA (RAG) ---\n{contexto_rag}\n---------------------------------\n"
        )

        prompt_final = f"{prompt_sistema}\nUsuário: {mensagem_usuario}\nKaelara:"

        try:
            # Envia a requisição leve para os servidores do Google
            response = self.model.generate_content(prompt_final)
            return response.text
        except Exception as e:
            print(f"[!] Erro ao chamar a API do Google: {e}")
            return "Desculpe, tive um problema temporário ao processar minha linha de pensamento na nuvem."
