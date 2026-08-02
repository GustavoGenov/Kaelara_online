import React, { useEffect, useRef } from 'react';

function RightPanel({
  activeView,
  historyItems,
  historyQuery,
  insights,
  messages,
  onDetectFaces,
  onLoadSession,
  onRefreshHistory,
  onSearchHistory,
  onSpeakLast,
  onToggleTheme,
  onVoiceInput,
  sessionTitle,
  theme,
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <aside className="right-panel">
      <div className="top-bar glass-panel">
        <div>
          <div className="section-label">Painel ativo</div>
          <strong>{activeView === 'memory' ? 'Memoria' : activeView === 'diagnostics' ? 'Diagnostico' : 'Chat'}</strong>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={onToggleTheme} type="button" title="Alternar tema">
            <span className="material-icons">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          </button>
          <button className="icon-btn" onClick={onRefreshHistory} type="button" title="Atualizar memoria">
            <span className="material-icons">refresh</span>
          </button>
        </div>
      </div>

      <section className="glass-panel chat-container">
        <div className="chat-header">
          <div>
            <span className="section-label">Conversa</span>
            <h3>{sessionTitle}</h3>
          </div>
          <span className="pill">Persistencia ativa</span>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={`${msg.role}-${idx}`} className={`msg-wrapper ${isUser ? 'user' : 'kae'}`}>
                <span className="msg-author">{isUser ? 'Voce' : 'Kaelara'}</span>
                <div className={`msg-bubble ${isUser ? 'msg-user' : 'msg-kae'}`}>{msg.content}</div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-controls">
          <button className="control-btn" onClick={onSpeakLast} type="button">
            <span className="material-icons">volume_up</span>
            Ouvir
          </button>
          <button className="control-btn" onClick={onVoiceInput} type="button">
            <span className="material-icons">mic</span>
            Ditar
          </button>
          <button className="control-btn" onClick={onDetectFaces} type="button">
            <span className="material-icons">videocam</span>
            Visao
          </button>
        </div>
      </section>

      <section className="glass-panel memory-panel">
        <div className="memory-header">
          <div>
            <span className="section-label">Memoria consultavel</span>
            <h3>Historico salvo</h3>
          </div>
          <input
            type="search"
            value={historyQuery}
            onChange={(event) => onSearchHistory(event.target.value)}
            placeholder="Buscar no historico"
          />
        </div>

        <div className="history-list">
          {historyItems.length ? (
            historyItems.map((item) => (
              <button key={item.session_id} className="history-card" onClick={() => onLoadSession(item.session_id)} type="button">
                <strong>{item.title}</strong>
                <span>{item.preview || 'Sem preview'}</span>
                <small>{item.message_count} mensagens</small>
              </button>
            ))
          ) : (
            <div className="empty-card">Nenhuma memoria encontrada ainda.</div>
          )}
        </div>
      </section>

      <section className="glass-panel diagnostics-panel">
        <div className="section-label">Funcoes reais</div>
        <div className="diagnostic-grid">
          <div className="diagnostic-card">
            <span>Banco de dados</span>
            <strong>{insights ? 'Ativo' : 'Verificando'}</strong>
          </div>
          <div className="diagnostic-card">
            <span>Audio</span>
            <strong>{insights?.audio_available ? 'Ativo' : 'Indisponivel'}</strong>
          </div>
          <div className="diagnostic-card">
            <span>Visao</span>
            <strong>{insights?.vision_available ? 'Ativo' : 'Indisponivel'}</strong>
          </div>
          <div className="diagnostic-card">
            <span>Ultimo provedor</span>
            <strong>{insights?.last_provider || 'Nao usado'}</strong>
          </div>
        </div>
      </section>
    </aside>
  );
}

export default RightPanel;
