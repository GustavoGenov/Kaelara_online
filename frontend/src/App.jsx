/**
 * ============================================================================
 * KAELARA A.I — COMPONENTE RAIZ DA APLICAÇÃO (ORQUESTRAÇÃO E ESTADOS)
 * ============================================================================
 * Gerencia o ciclo de vida global da Kaelara:
 * 1. Inicialização de sessões únicas e persistência em LocalStorage.
 * 2. Alternância de temas (Claro / Escuro) com persistência de preferências.
 * 3. Envio de mensagens com suporte duplo: Server-Sent Events (SSE Stream)
 *    para digitação em tempo real com fallback automático para rota HTTP JSON.
 * 4. Habilidades multimodais ativas:
 *    - Síntese de voz neural feminina nativa via Web Speech Synthesis.
 *    - Reconhecimento de fala via Web SpeechRecognition API.
 *    - Visão computacional com captura direta de webcam (getUserMedia) e envio em Base64.
 *    - Upload e análise de imagens/documentos anexados.
 *    - Consulta automática de contexto meteorológico em tempo real (Open-Meteo API).
 * 5. Registro analítico de visitas e integração com o Supabase.
 * 
 * @module frontend/src/App
 */

import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import { supabase } from './lib/supabase';

/**
 * Gera um identificador alfanumérico pseudo-aleatório seguro para a sessão.
 * 
 * @returns {string} ID único de sessão de 26 caracteres.
 */
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/** Saudação padrão inicial da Kaelara para novos visitantes */
const INITIAL_GREETING = 'Olá! Sou a Kaelara. Como posso te chamar?';

/**
 * Componente principal da aplicação Kaelara A.I.
 * 
 * @returns {React.JSX.Element} Estrutura completa da interface com avatar, barra lateral e chat.
 */
function App() {
  // Estado do histórico de mensagens ativas na interface
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: INITIAL_GREETING
    }
  ]);
  
  // Estado de carregamento da resposta da inteligência artificial
  const [isLoading, setIsLoading] = useState(false);
  
  // Identificador da sessão atual (recuperado do LocalStorage ou instanciado)
  const [sessionId, setSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem('kaelara_session_id');
      if (saved) return saved;
      const newId = generateSessionId();
      localStorage.setItem('kaelara_session_id', newId);
      return newId;
    } catch {
      return generateSessionId();
    }
  });

  // Estado de escuta do microfone (Speech-to-Text)
  const [isListening, setIsListening] = useState(false);
  
  // Estado e referências para a captura de vídeo da câmera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);

  // Estado do tema de cores (Claro / Escuro)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // URL base da API (Render para produção ou localhost para desenvolvimento local)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || (
    typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://127.0.0.1:5000'
      : 'https://kaelara-online.onrender.com'
  );

  /**
   * Efeito de inicialização:
   * - Carrega e aplica o tema escuro salvo pelo usuário.
   * - Notifica o backend com telemetria anônima de visita para métricas de auditoria.
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('kaelara_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }

    const logVisit = async () => {
      try {
        fetch(`${API_BASE}/api/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: window.location.pathname + window.location.hash,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent
          })
        }).catch(() => {});
      } catch (e) {
        console.error('Erro ao registrar visita:', e);
      }
    };
    logVisit();
  }, [API_BASE]);

  /**
   * Reinicializa a conversa ativa com uma nova sessão e limpa a tela para a saudação inicial.
   */
  const startNewChat = () => {
    const newId = generateSessionId();
    try {
      localStorage.setItem('kaelara_session_id', newId);
    } catch {}
    setSessionId(newId);
    setMessages([
      {
        role: 'assistant',
        content: INITIAL_GREETING
      }
    ]);
  };

  /**
   * Alterna entre o modo visual Claro e Escuro, aplicando classes ao elemento raiz e persistindo no storage.
   */
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('kaelara_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('kaelara_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  /**
   * Sintetiza o texto em áudio vocal através da Web Speech API nativa.
   * Prioriza timbres femininos em português brasileiro para conferir a identidade vocal da Kaelara.
   * 
   * @param {string} text - Mensagem a ser vocalizada.
   */
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
      
      let spoken = false;
      const setVoiceAndSpeak = () => {
        if (spoken) return;
        spoken = true;
        const voices = window.speechSynthesis.getVoices();
        const femaleNames = ['maria', 'francisca', 'luciana', 'vitoria', 'heloisa', 'zira', 'leticia', 'feminine', 'female', 'mulher'];
        let chosenVoice = voices.find(v => v.lang.includes('pt-BR') && femaleNames.some(name => v.name.toLowerCase().includes(name)));
        
        if (!chosenVoice) {
           chosenVoice = voices.find(v => v.lang.includes('pt-BR'));
        }
        
        if (chosenVoice) utterance.voice = chosenVoice;
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      }
    }
  };

  /**
   * Consulta dados meteorológicos verídicos via Open-Meteo caso a intenção do usuário mencione clima ou previsão.
   * 
   * @returns {Promise<string>} Contexto em texto contendo temperatura, vento e umidade.
   */
  const getWeatherContext = async () => {
    try {
      const lat = -15.7801;
      const lon = -47.9292;
      
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo`);
      const data = await res.json();
      
      if (data && data.current) {
        return `[DADOS CLIMÁTICOS REAIS EM TEMPO REAL: Temp: ${data.current.temperature_2m}°C, Vento: ${data.current.wind_speed_10m}km/h, Umidade: ${data.current.relative_humidity_2m}%] `;
      }
    } catch (e) {
      console.error('Erro ao buscar clima', e);
    }
    return '';
  };

  /**
   * Orquestra o envio de mensagens do usuário para o backend.
   * - Enriquece perguntas meteorológicas com dados em tempo real.
   * - Executa transmissão por streaming via Server-Sent Events (SSE).
   * - Aciona fallback automático para endpoint HTTP tradicional se o streaming for bloqueado.
   * - Dispara a síntese de voz caso a mensagem tenha sido enviada por comando de voz.
   * 
   * @param {string} text - Conteúdo da mensagem enviada.
   * @param {boolean} [isVoice=false] - Se a mensagem originou de reconhecimento de voz.
   * @param {string|null} [imageBase64=null] - Imagem anexada codificada em base64.
   */
  const handleSendMessage = async (text, isVoice = false, imageBase64 = null) => {
    let finalMsg = text;
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('clima') || lowerText.includes('tempo') || lowerText.includes('chov') || lowerText.includes('sol')) {
       const weatherContext = await getWeatherContext();
       finalMsg = weatherContext + text;
    }

    const newMsg = { role: 'user', content: text }; 
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      if (supabase) {
        supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'user', content: text }]).then();
      }

      // Tentativa 1: Streaming via SSE para digitação em tempo real
      let streamSucceeded = false;
      try {
        const streamRes = await fetch(`${API_BASE}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: finalMsg, session_id: sessionId, image: imageBase64 })
        });

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let fullAnswer = '';
          let addedPlaceholder = false;
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.type === 'chunk') {
                    if (!addedPlaceholder) {
                      setMessages(prev => [...prev, { role: 'assistant', content: parsed.text }]);
                      addedPlaceholder = true;
                    } else {
                      setMessages(prev => {
                        const next = [...prev];
                        next[next.length - 1] = { role: 'assistant', content: fullAnswer + parsed.text };
                        return next;
                      });
                    }
                    fullAnswer += parsed.text;
                  } else if (parsed.type === 'done') {
                    fullAnswer = parsed.answer || fullAnswer;
                    if (parsed.profile && parsed.profile.is_returning && parsed.messages && parsed.messages.length > 0) {
                      if (parsed.session_id) {
                        setSessionId(parsed.session_id);
                        try { localStorage.setItem('kaelara_session_id', parsed.session_id); } catch {}
                      }
                      setMessages(parsed.messages.map(m => ({ role: m.role, content: m.content })));
                    }
                  }
                } catch {
                  // Chunk intermediário incompleto ignorado
                }
              }
            }
          }

          if (fullAnswer.trim()) {
            streamSucceeded = true;
            if (supabase) {
              supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'assistant', content: fullAnswer }]).then();
            }
            if (isVoice) {
              speakText(fullAnswer.replace(/[*#]/g, ''));
            }
          }
        }
      } catch (streamErr) {
        console.warn('Streaming falhou, tentando rota padrão /api/chat:', streamErr);
      }

      // Fallback: Se o streaming falhou ou foi bloqueado por proxy, utiliza a rota padrão
      if (!streamSucceeded) {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: finalMsg, session_id: sessionId, image: imageBase64 })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.profile && data.profile.is_returning && data.messages && data.messages.length > 0) {
            if (data.session_id) {
              setSessionId(data.session_id);
              try { localStorage.setItem('kaelara_session_id', data.session_id); } catch {}
            }
            setMessages(data.messages.map(m => ({ role: m.role, content: m.content })));
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
          }
          if (supabase) {
            supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'assistant', content: data.answer }]).then();
          }
          if (isVoice) {
            speakText(data.answer.replace(/[*#]/g, ''));
          }
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${data.error}` }]);
        }
      }
    } catch (error) {
      console.error('Falha de conexão com a Kaelara:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema de conexão. Podemos tentar novamente?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicia a escuta por voz via Web SpeechRecognition API no navegador.
   */
  const handleVoiceClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleSendMessage(transcript, true);
    };
    recognition.start();
  };

  /**
   * Processa anexos de arquivos ou fotos selecionados pelo usuário no input local.
   * Converte imagens para Base64 para envio à visão multimodal do Gemini.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de mudança de arquivo.
   */
  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const base64 = evt.target.result;
          handleSendMessage(`Analise esta imagem (${file.name}) que anexei para você. O que você observa?`, false, base64);
        };
        reader.readAsDataURL(file);
      } else {
        const msg = `[Arquivo ${file.name} anexado]`;
        handleSendMessage(`${msg} Olá Kaelara, registrei o arquivo ${file.name}.`);
      }
    }
  };

  /**
   * Ativa a câmera web do dispositivo através da API MediaDevices.
   */
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      alert("Erro ao acessar a câmera do computador: " + e.message);
      setIsCameraOpen(false);
    }
  };

  /**
   * Captura o frame de vídeo atual da webcam, desenha em canvas e envia para a Kaelara analisar.
   */
  const takePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const stream = video.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
      setIsCameraOpen(false);

      handleSendMessage('Olhe esta foto que tirei da câmera agora para você. O que você vê?', false, photoDataUrl);
    }
  };

  /**
   * Interrompe as tracks de streaming da câmera e fecha o modal de captura.
   */
  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsCameraOpen(false);
  };

  return (
    <>
      {/* Imagem de fundo e partículas decorativas da Kaelara */}
      <div className="avatar-background" aria-hidden="true"></div>
      
      <div className="sparkle" style={{ top: '20%', right: '15%', width: '4px', height: '4px', animationDelay: '0s' }}></div>
      <div className="sparkle" style={{ top: '40%', right: '8%', width: '6px', height: '6px', animationDelay: '1s' }}></div>
      <div className="sparkle" style={{ top: '60%', right: '25%', width: '3px', height: '3px', animationDelay: '2s' }}></div>

      {/* CONTAINER PRINCIPAL DA APLICAÇÃO */}
      <div className="app-container" style={{ paddingBottom: '50px' }}>
        <LeftPanel 
          onVoiceClick={handleVoiceClick} 
          onFileAttach={handleFileAttach} 
          isListening={isListening} 
          onCameraClick={startCamera}
          onToggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          onNewChat={startNewChat}
        />
        <CenterPanel messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* RODAPÉ DO ECOSSISTEMA E PÁGINAS INSTITUCIONAIS */}
      <footer className="kaelara-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Rede Oficial Integrada:</span>
          <a href="https://vozdaia.com/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
            <img src="/ecosystem/vozdaia.svg" alt="Voz da IA" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
            Voz da I.A ↗
          </a>
          <a href="https://jornal-arcanjo.vercel.app/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
            <img src="/ecosystem/arcanjo.svg" alt="Jornal Arcanjo" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
            Jornal Arcanjo ↗
          </a>
          <a href="https://cursos-livres-tech-ia.vercel.app/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2dd4bf', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
            <img src="/ecosystem/cursos.svg" alt="Cursos Tech & IA" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
            Cursos Tech & I.A ↗
          </a>
        </div>
        <a href="/projeto" style={{ color: '#ff7f76', fontWeight: 'bold' }}>O Projeto Kaelara (Manifesto &amp; Engenharia)</a>
        <a href="/sobre">Quem Somos / Equipe</a>
        <a href="/termos">Termos de Uso</a>
        <a href="/politica-de-privacidade">Política de Privacidade</a>
      </footer>

      {/* MODAL DE CÂMERA E VISÃO COMPUTACIONAL */}
      {isCameraOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <video ref={videoRef} style={{ width: '80%', maxWidth: '600px', borderRadius: '16px', background: '#000' }}></video>
          <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
            <button onClick={takePhoto} className="btn-primary" style={{ padding: '12px 24px', fontSize: '16px' }}>
              <span className="material-icons-round" style={{ marginRight: '8px' }}>photo_camera</span>
              Tirar Foto
            </button>
            <button onClick={closeCamera} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '16px', background: '#333', color: '#fff' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
