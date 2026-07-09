import React, { useState } from 'react';

function CenterPanel({ onSendMessage }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
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
    <div className="center-panel">
      <div className="glass-panel thought-bubble">
        Sinta a ressoriência silenciosa do sistema. Um espaço definido pela luz, respirando com intenção arquitetônica.
      </div>

      <div className="glass-panel command-bar">
        <input 
          type="text" 
          placeholder="Emitir comando tático..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button className="btn-send" onClick={handleSend}>
          <span className="material-icons">send</span>
        </button>
      </div>
    </div>
  );
}

export default CenterPanel;
