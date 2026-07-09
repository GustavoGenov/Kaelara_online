import React, { useRef, useEffect } from 'react';

function RightPanel({ messages }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="right-panel">
      <div className="top-bar">
        <span className="material-icons" style={{color: 'var(--text-muted)', cursor: 'pointer'}}>settings</span>
        <span className="material-icons" style={{color: 'var(--text-muted)', cursor: 'pointer'}}>history</span>
        <div className="user-info">
          <div className="user-text">
            <div className="user-label">USUÁRIO</div>
            <div className="user-name">Gustavo / Daiene</div>
          </div>
          <div className="user-avatar"></div>
        </div>
      </div>

      <div className="glass-panel chat-container">
        <div className="chat-header">
          <span>INTERFACE NEURAL ATIVA</span>
          <span className="enc-badge">ENCRIPTAÇÃO ATIVA</span>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`msg-wrapper ${isUser ? 'user' : 'kae'}`}>
                <span className="msg-author">{isUser ? 'USUÁRIO' : 'KAE'}</span>
                <div className={`msg-bubble ${isUser ? 'msg-user' : 'msg-kae'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-controls">
          <button className="control-btn"><span className="material-icons">volume_up</span></button>
          <button className="control-btn"><span className="material-icons">mic</span></button>
          <button className="control-btn"><span className="material-icons">videocam</span></button>
          <button className="control-btn"><span className="material-icons">attach_file</span></button>
        </div>
      </div>

      <div className="status-bars glass-panel">
        <div className="status-bar-wrapper" style={{borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
          <div className="bar-header">
            <span>MATRIZ EMOCIONAL</span>
            <span className="bar-value-text">Serena</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{width: '92%'}}></div>
          </div>
        </div>
        <div className="status-bar-wrapper">
          <div className="bar-header">
            <span>CARGA DE PROCESSAMENTO</span>
            <span className="bar-value-text" style={{color: 'var(--text-main)'}}>8.7%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{width: '8.7%', background: 'var(--text-main)'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightPanel;
