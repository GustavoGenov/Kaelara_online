import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import { supabase } from './lib/supabase';

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou a Kaelara. Como posso ajudar a tornar seu dia mais produtivo e tranquilo hoje?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId());
  const [isListening, setIsListening] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const logVisit = async () => {
      try {
        await supabase.from('kaelara_visits').insert([{
          user_agent: navigator.userAgent,
          endpoint: window.location.pathname
        }]);
      } catch (e) { console.error('Erro ao registrar visita:', e); }
    };
    logVisit();
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.pitch = 0.9;
      utterance.rate = 0.88;
      
      const setVoiceAndSpeak = () => {
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
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
        setTimeout(setVoiceAndSpeak, 200);
      }
    }
  };

  const getWeatherContext = async () => {
    try {
      let lat = -15.7801;
      let lon = -47.9292;
      
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

  const handleSendMessage = async (text, isVoice = false) => {
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
      supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'user', content: text }]).then();

      const response = await fetch('https://kaelara-online.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalMsg, session_id: sessionId })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'assistant', content: data.answer }]).then();
        if (isVoice) {
          speakText(data.answer.replace(/[*#]/g, ''));
        }
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

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      const msg = `[Arquivo ${file.name} anexado]`;
      setMessages(prev => [...prev, { role: 'user', content: msg }]);
      setTimeout(() => {
        const reply = "Ainda estou aprendendo a processar arquivos visuais e documentos diretamente pela web, mas já registrei seu anexo na nossa conversa!";
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'assistant', content: reply }]).then();
        if ('speechSynthesis' in window) speakText(reply);
      }, 1000);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      alert("Erro ao acessar a câmera do PC: " + e.message);
      setIsCameraOpen(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const msg = `[Foto capturada da webcam]`;
      setMessages(prev => [...prev, { role: 'user', content: msg }]);
      
      const stream = videoRef.current.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
      setIsCameraOpen(false);
      
      setTimeout(() => {
        const reply = "Olha só, recebi sua foto! Como ainda estou em treinamento visual avançado, guardei a imagem na nossa memória com muito carinho.";
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        supabase.from('kaelara_messages').insert([{ session_id: sessionId, role: 'assistant', content: reply }]).then();
        if ('speechSynthesis' in window) speakText(reply);
      }, 1000);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsCameraOpen(false);
  };

  return (
    <>
      <div className="avatar-background"></div>
      
      <div className="sparkle" style={{top: '20%', right: '15%', width: '4px', height: '4px', animationDelay: '0s'}}></div>
      <div className="sparkle" style={{top: '40%', right: '8%', width: '6px', height: '6px', animationDelay: '1s'}}></div>
      <div className="sparkle" style={{top: '60%', right: '25%', width: '3px', height: '3px', animationDelay: '2s'}}></div>

      <div className="app-container">
        <LeftPanel 
          onVoiceClick={handleVoiceClick} 
          onFileAttach={handleFileAttach} 
          isListening={isListening} 
          onCameraClick={startCamera} 
        />
        <CenterPanel messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {isCameraOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <video ref={videoRef} style={{ width: '80%', maxWidth: '600px', borderRadius: '12px', background: '#000' }}></video>
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
            <button onClick={takePhoto} className="btn-primary" style={{ padding: '12px 24px', fontSize: '18px' }}>
              <span className="material-icons-round" style={{marginRight: '8px'}}>photo_camera</span>
              Tirar Foto
            </button>
            <button onClick={closeCamera} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '18px', background: '#333' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
