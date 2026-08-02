import React, { useState } from 'react';

function CenterPanel({ isLoading, onAttachClick, onSendMessage, sessionTitle, statusMessage }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) {
      return;
    }
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="center-panel">
      <section className="hero-card glass-panel">
        <div className="hero-copy">
          <span className="section-label">Sessao atual</span>
          <h2>{sessionTitle}</h2>
          <p>
            Kaelara agora pode manter historico persistente, recuperar memorias anteriores e expor diagnosticos do que
            esta realmente funcionando.
          </p>
        </div>
        <div className="hero-status">
          <span className={`status-dot ${isLoading ? 'busy' : 'idle'}`}></span>
          <span>{statusMessage}</span>
        </div>
      </section>

      <section className="composer glass-panel">
        <textarea
          rows={4}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem, cole contexto ou anexe um arquivo para Kaelara analisar."
        />

        <div className="composer-actions">
          <button className="btn-secondary" type="button" onClick={onAttachClick}>
            <span className="material-icons">attach_file</span>
            Anexar arquivo
          </button>
          <button className="btn-primary" type="button" onClick={handleSend} disabled={isLoading}>
            <span className="material-icons">send</span>
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </section>
    </main>
  );
}

export default CenterPanel;
