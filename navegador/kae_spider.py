import sys
import os
import urllib.parse

from PySide6.QtWidgets import QApplication
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtCore import QUrl, QTimer

class KaeSpider(QWebEngineView):
    def __init__(self, query):
        super().__init__()
        self.query = query
        
        # Timer de timeout (10 segundos)
        self.timeout_timer = QTimer(self)
        self.timeout_timer.setSingleShot(True)
        self.timeout_timer.timeout.connect(self.on_timeout)
        self.timeout_timer.start(10000)

        self.loadFinished.connect(self.on_load_finished)
        
        # URL de busca usando duckduckgo HTML puro (mais fácil para ler texto cru sem anúncios agressivos JS)
        encoded_query = urllib.parse.quote_plus(self.query)
        self.url_busca = f"https://html.duckduckgo.com/html/?q={encoded_query}"
        
        self.load(QUrl(self.url_busca))

    def on_load_finished(self, ok):
        if ok:
            # Captura o texto que está visível na página
            self.page().toPlainText(self.processar_texto)
        else:
            print("[ERRO]: Falha ao renderizar a página pelo WebEngine.")
            self.encerrar()

    def processar_texto(self, texto):
        if texto:
            # Limpa quebras de linhas desnecessárias
            linhas = [linha.strip() for linha in texto.split("\n") if linha.strip()]
            texto_limpo = "\n".join(linhas)
            print(texto_limpo)
        else:
            print("[ERRO]: Página carregou, mas estava vazia.")
            
        self.encerrar()

    def on_timeout(self):
        print("[ERRO]: O carregamento da página excedeu 10 segundos.")
        self.encerrar()
        
    def encerrar(self):
        self.timeout_timer.stop()
        QApplication.quit()

def main():
    if len(sys.argv) < 2:
        print("[ERRO]: Comando vazio.")
        sys.exit(1)
        
    query = " ".join(sys.argv[1:])
    
    # Forçar saída utf-8 no Windows para evitar UnicodeDecodeError
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    
    # Flags exigidas pelo Chromium embarcado
    os.environ["QTWEBENGINE_DISABLE_SANDBOX"] = "1"
    os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = "--disable-gpu"

    app = QApplication.instance()
    if not app:
        app = QApplication(sys.argv)
        
    spider = KaeSpider(query)
    # Rodar sem chamar show() torna o robô invisível
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
