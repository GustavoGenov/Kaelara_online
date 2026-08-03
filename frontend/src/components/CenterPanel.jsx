import React, { useState, useRef, useEffect } from 'react';

function CenterPanel({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <main className="center-panel">
      
      <div className="glass-panel chat-messages">
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
        {isLoading && (
          <div className="msg-wrapper kae">
            <span className="msg-author">Kaelara</span>
            <div className="msg-bubble" style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
              <span className="material-icons-round" style={{animation: 'twinkle 1.5s infinite'}}>auto_awesome</span>
              Pensando...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="composer-bar">
        <input
          type="text"
          placeholder="Envie uma mensagem carinhosa para Kaelara..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isLoading}
        />
        <button className="btn-send" onClick={handleSend} disabled={isLoading}>
          <span className="material-icons-round">send</span>
        </button>
      </div>

    </main>
  );
}

export default CenterPanel;
