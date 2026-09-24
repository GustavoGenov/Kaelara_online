/**
 * ============================================================================
 * KAELARA A.I — PAINEL CENTRAL DE DIÁLOGO (MENSAGENS & COMPOSER)
 * ============================================================================
 * Gerencia a área de fluxo de conversa, rolagem automática contínua para as
 * mensagens mais recentes, visualização do estado de raciocínio (thinking) da
 * Kaelara e barra de composição com envio por tecla Enter ou botão de ação.
 * 
 * @module frontend/src/components/CenterPanel
 */

import React, { useState, useRef, useEffect } from 'react';

/**
 * Propriedades esperadas pelo componente CenterPanel.
 * @typedef {Object} CenterPanelProps
 * @property {Array<{role: string, content: string}>} messages - Histórico de mensagens da sessão ativa.
 * @property {function(string, boolean?, string?): void} onSendMessage - Callback disparado para enviar nova mensagem.
 * @property {boolean} isLoading - Indicador de carregamento/processamento cognitivo da Kaelara.
 */

/**
 * Renderiza o fluxo de chat em glassmorphism e o campo de digitação do usuário.
 * 
 * @param {CenterPanelProps} props - Propriedades do componente.
 * @returns {React.JSX.Element} Painel central interativo de chat.
 */
function CenterPanel({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  /**
   * Mantém o scroll ancorado no final da tela a cada nova mensagem recebida ou transmitida.
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Trata o disparo de envio da mensagem textual inserida pelo usuário.
   */
  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  /**
   * Captura o acionamento da tecla Enter para submissão imediata.
   * 
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Evento de teclado.
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <main className="center-panel" aria-label="Área de Conversação com a Kaelara">
      
      {/* HISTÓRICO VISUAL DAS MENSAGENS EM VIDRO FOSCO */}
      <div className="glass-panel chat-messages" role="log" aria-live="polite">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`msg-wrapper ${isUser ? 'user' : 'kae'}`}>
              <span className="msg-author">{isUser ? 'Você' : 'Kaelara'}</span>
              <div className="msg-bubble">
                {msg.content}
              </div>
            </div>
          );
        })}
        
        {/* INDICADOR DE CARREGAMENTO / RACIOCÍNIO COGNITIVO */}
        {isLoading && (
          <div className="msg-wrapper kae" aria-busy="true">
            <span className="msg-author">Kaelara</span>
            <div className="msg-bubble" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span className="material-icons-round" style={{ animation: 'twinkle 1.5s infinite' }}>auto_awesome</span>
              Pensando...
            </div>
          </div>
        )}
        
        {/* Âncora invisível para rolagem automática */}
        <div ref={chatEndRef} />
      </div>

      {/* BARRA DE COMPOSIÇÃO DE TEXTO */}
      <div className="composer-bar">
        <input
          type="text"
          placeholder="Envie uma mensagem carinhosa para Kaelara..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isLoading}
          aria-label="Campo de mensagem para a Kaelara"
        />
        <button 
          className="btn-send" 
          onClick={handleSend} 
          disabled={isLoading}
          title="Enviar mensagem"
          aria-label="Enviar mensagem"
        >
          <span className="material-icons-round">send</span>
        </button>
      </div>

    </main>
  );
}

export default CenterPanel;
