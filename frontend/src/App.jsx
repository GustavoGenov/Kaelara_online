import React, { useEffect, useRef, useState } from 'react';
import './index.css';
import CenterPanel from './components/CenterPanel';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

const localApi = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://kaelara-online.onrender.com';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || localApi).replace(/\/$/, '');

const initialAssistantMessage = {
  role: 'assistant',
  content: 'Kaelara sincronizada. Posso conversar, lembrar o historico desta sessao e recuperar memorias salvas.',
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('kaelara-theme') || 'light');
  const [messages, setMessages] = useState([initialAssistantMessage]);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('kaelara-session-id') || '');
  const [sessionTitle, setSessionTitle] = useState('Nova conversa');
  const [historyItems, setHistoryItems] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [insights, setInsights] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Pronta para conversar');
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('kaelara-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('kaelara-session-id', sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    loadHistory();
    loadInsights();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, []);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  const loadHistory = async (query = historyQuery) => {
    try {
      const url = new URL(`${API_BASE}/api/history`);
      if (query.trim()) {
        url.searchParams.set('q', query.trim());
      }
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setHistoryItems(data.items || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/insights`);
      const data = await response.json();
      if (response.ok) {
        setInsights(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadSession = async (targetSessionId) => {
    try {
      const response = await fetch(`${API_BASE}/api/history/${targetSessionId}`);
      const data = await response.json();
      if (!response.ok) {
        setStatusMessage(data.error || 'Nao consegui abrir esse historico.');
        return;
      }
      setSessionId(data.session_id);
      setSessionTitle(data.title || 'Conversa');
      setMessages(
        (data.messages || []).length
          ? data.messages.map((message) => ({ role: message.role, content: message.content }))
          : [initialAssistantMessage]
      );
      setActiveView('memory');
      setStatusMessage('Memoria restaurada com sucesso.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Falha ao carregar a memoria selecionada.');
    }
  };

  const handleSendMessage = async (text) => {
    const cleanText = text.trim();
    if (!cleanText || loading) {
      return;
    }

    const optimisticMessages = [...messages, { role: 'user', content: cleanText }];
    setMessages(optimisticMessages);
    setLoading(true);
    setStatusMessage('Kaelara esta processando sua mensagem...');

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanText, session_id: sessionId || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setSessionId(data.session_id);
      setSessionTitle(data.session_title || 'Conversa');
      setMessages((data.messages || []).map((message) => ({ role: message.role, content: message.content })));
      setStatusMessage(`Resposta entregue via ${data.provider || 'IA configurada'}.`);
      await Promise.all([loadHistory(), loadInsights()]);
    } catch (error) {
      console.error(error);
      setMessages([...optimisticMessages, { role: 'assistant', content: `Erro: ${error.message}` }]);
      setStatusMessage('Nao consegui concluir a resposta agora.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setSessionId('');
    setSessionTitle('Nova conversa');
    setMessages([initialAssistantMessage]);
    localStorage.removeItem('kaelara-session-id');
    setActiveView('chat');
    setStatusMessage('Nova conversa iniciada.');
  };

  const handleSpeakLast = () => {
    const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastAssistantMessage) {
      setStatusMessage('Ainda nao ha resposta para reproduzir.');
      return;
    }
    if (!('speechSynthesis' in window)) {
      setStatusMessage('Seu navegador nao suporta leitura em voz alta.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastAssistantMessage.content);
    utterance.lang = 'pt-BR';
    window.speechSynthesis.speak(utterance);
    setStatusMessage('Reproduzindo a ultima resposta.');
  };

  const handleVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatusMessage('Ditado por voz nao esta disponivel neste navegador.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setStatusMessage('Ouvindo voce...');
    recognition.onerror = () => setStatusMessage('Nao consegui capturar sua voz desta vez.');
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        handleSendMessage(transcript);
      }
    };
    recognition.start();
  };

  const handleVisionCheck = async () => {
    setStatusMessage('Consultando modulo de visao...');
    try {
      const response = await fetch(`${API_BASE}/api/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Visao indisponivel');
      }
      setStatusMessage(`Visao ativa. Rostos detectados: ${Array.isArray(data.faces) ? data.faces.length : 0}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const trimmedContent = content.slice(0, 4000);
      const prompt = `Analise este arquivo anexado.\nNome: ${file.name}\nConteudo:\n${trimmedContent}`;
      setStatusMessage(`Arquivo ${file.name} anexado para analise.`);
      handleSendMessage(prompt);
    } catch (error) {
      console.error(error);
      setStatusMessage('Nao foi possivel ler o arquivo selecionado.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRunDiagnostics = async () => {
    await loadInsights();
    setActiveView('diagnostics');
    setStatusMessage('Diagnostico atualizado.');
  };

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept=".txt,.md,.json,.csv,.py,.js,.ts,.tsx,.html,.css"
        onChange={handleFileSelected}
      />

      <div className="ambient-glow ambient-left"></div>
      <div className="ambient-glow ambient-right"></div>

      <div className="app-container">
        <LeftPanel
          activeView={activeView}
          historyCount={historyItems.length}
          insights={insights}
          onNewChat={handleNewChat}
          onRefreshHistory={() => loadHistory('')}
          onRunDiagnostics={handleRunDiagnostics}
          setActiveView={setActiveView}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <CenterPanel
          isLoading={loading}
          onAttachClick={handleAttachClick}
          onSendMessage={handleSendMessage}
          sessionTitle={sessionTitle}
          statusMessage={statusMessage}
        />
        <RightPanel
          activeView={activeView}
          historyItems={historyItems}
          historyQuery={historyQuery}
          insights={insights}
          messages={messages}
          onDetectFaces={handleVisionCheck}
          onLoadSession={loadSession}
          onRefreshHistory={() => loadHistory(historyQuery)}
          onSearchHistory={(value) => {
            setHistoryQuery(value);
            loadHistory(value);
          }}
          onSpeakLast={handleSpeakLast}
          onToggleTheme={toggleTheme}
          onVoiceInput={handleVoiceInput}
          sessionTitle={sessionTitle}
          theme={theme}
        />
      </div>
    </div>
  );
}

export default App;
