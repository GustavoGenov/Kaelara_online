import React, { useState } from 'react';

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', content: input };
    setMessages([...messages, newMsg]);
    // Placeholder: enviar ao backend / LLM e receber resposta
    setInput('');
    // Simular resposta (para demo)
    setTimeout(() => {
      const reply = { role: 'assistant', content: 'Essa é uma resposta simulada da Kaelara.' };
      setMessages(prev => [...prev, reply]);
    }, 800);
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}> {msg.content} </div>
        ))}
      </div>
      <div className="chat-input">
        <textarea
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
}

export default ChatWindow;
