# -*- coding: utf-8 -*-
"""Módulo de Coleta e Navegação Web Headless da Kaelara (KaeSpider).

Utiliza PySide6 e QtWebEngineWidgets para navegar em páginas web de forma silenciosa (invisível),
extraindo texto puro de resultados de busca (DuckDuckGo HTML) para enriquecimento de contexto.
Possui temporizador de timeout de segurança para evitar bloqueio de processos.
"""

import os
import sys
import urllib.parse

from PySide6.QtCore import QTimer, QUrl
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWidgets import QApplication


class KaeSpider(QWebEngineView):
    """Robô de navegação web headless baseado no motor Chromium do Qt."""

    def __init__(self, query: str):
        """Inicializa o navegador headless e inicia a requisição de busca.

        Args:
            query: Termo ou pergunta a ser pesquisada na web.
        """
        super().__init__()
        self.query = query

        # Timer de timeout (10 segundos) para impedir travamento do subprocesso
        self.timeout_timer = QTimer(self)
        self.timeout_timer.setSingleShot(True)
        self.timeout_timer.timeout.connect(self.on_timeout)
        self.timeout_timer.start(10000)

        self.loadFinished.connect(self.on_load_finished)

        # URL de busca usando DuckDuckGo versão HTML pura (otimizada para extração textual limpa)
        encoded_query = urllib.parse.quote_plus(self.query)
        self.url_busca = f"https://html.duckduckgo.com/html/?q={encoded_query}"

        self.load(QUrl(self.url_busca))

    def on_load_finished(self, ok: bool):
        """Callback acionado após o término do carregamento da página no motor web.

        Args:
            ok: Booleano indicando sucesso no download e renderização do DOM.
        """
        if ok:
            # Captura o texto que está visível na página
            self.page().toPlainText(self.processar_texto)
        else:
            print("[ERRO]: Falha ao renderizar a página pelo WebEngine.")
            self.encerrar()

    def processar_texto(self, texto: str):
        """Processa, normaliza quebras de linha e exibe o texto extraído no stdout.

        Args:
            texto: Texto bruto retornado pelo DOM da página.
        """
        if texto:
            linhas = [linha.strip() for linha in texto.split("\n") if linha.strip()]
            texto_limpo = "\n".join(linhas)
            print(texto_limpo)
        else:
            print("[ERRO]: Página carregou, mas estava vazia.")

        self.encerrar()

    def on_timeout(self):
        """Interrompe a execução caso a requisição exceda o tempo limite de 10 segundos."""
        print("[ERRO]: O carregamento da página excedeu 10 segundos.")
        self.encerrar()

    def encerrar(self):
        """Para o temporizador e finaliza a aplicação Qt."""
        self.timeout_timer.stop()
        QApplication.quit()


def main():
    """Ponto de entrada do script CLI para execução do crawler headless."""
    if len(sys.argv) < 2:
        print("[ERRO]: Comando vazio.")
        sys.exit(1)

    query = " ".join(sys.argv[1:])

    # Forçar saída UTF-8 no Windows para evitar UnicodeDecodeError
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    # Flags exigidas pelo Chromium embarcado para execução headless sem GPU
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
