import React, { useState } from 'react';
import './index.css';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Saudações. Sistemas sincronizados e prontos. Como posso auxiliar você hoje?'
    }
  ]);

  const handleSendMessage = async (text) => {
    const newMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, falha na conexão com os servidores.' }]);
    }
  };

  return (
    <div className="app-container">
      <LeftPanel />
      <CenterPanel onSendMessage={handleSendMessage} />
      <RightPanel messages={messages} />
    </div>
  );
}

export default App;
