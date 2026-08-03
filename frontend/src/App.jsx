import React, { useState } from 'react';
import './index.css';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou a Kaelara. Como posso ajudar a tornar seu dia mais produtivo e tranquilo hoje?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text) => {
    const newMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('https://kaelara-online.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${data.error}` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema de conexão. Podemos tentar novamente?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="avatar-background"></div>
      
      {/* Decorative Sparkles */}
      <div className="sparkle" style={{top: '20%', right: '15%', width: '4px', height: '4px', animationDelay: '0s'}}></div>
      <div className="sparkle" style={{top: '40%', right: '8%', width: '6px', height: '6px', animationDelay: '1s'}}></div>
      <div className="sparkle" style={{top: '60%', right: '25%', width: '3px', height: '3px', animationDelay: '2s'}}></div>

      <div className="app-container">
        <LeftPanel />
        <CenterPanel messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </>
  );
}

export default App;
