import React, { useState } from 'react';

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    const newMsg = { role: 'user', content: userMsg };
    setMessages(prev => [...prev, newMsg]);
    
    try {
      // Manda pro cérebro da Kaelara no Render
      const response = await fetch('https://kaelara-online.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${data.error}` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, não consegui conectar ao meu cérebro na nuvem no momento.' }]);
    }
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
