import React, { useRef } from 'react';

function LeftPanel({ onVoiceClick, onFileAttach, isListening, onCameraClick, onToggleTheme, isLightMode }) {
  const fileInputRef = useRef(null);

  return (
    <aside className="glass-panel left-panel">
      
      <header className="brand-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon">
            <span className="material-icons-round">auto_awesome</span>
          </div>
          <div>
            <div className="brand-title">Kaelara</div>
            <div className="brand-subtitle">AI ASSISTANT</div>
          </div>
        </div>
        <button className="tool-btn" onClick={onToggleTheme} style={{ background: 'transparent', padding: '8px', border: 'none' }} title="Alternar Tema">
          <span className="material-icons-round">{isLightMode ? 'dark_mode' : 'light_mode'}</span>
        </button>
      </header>

      <div className="section-title">Ações Rápidas</div>
      <div className="tools-grid">
        <button className="tool-btn" onClick={onVoiceClick} style={{ background: isListening ? '#f44336' : '', color: isListening ? '#fff' : '' }}>
          <span className="material-icons-round">{isListening ? 'mic_none' : 'mic'}</span>
          <span className="label">{isListening ? 'Ouvindo...' : 'Falar'}</span>
        </button>
        
        <button className="tool-btn" onClick={onCameraClick}>
          <span className="material-icons-round">videocam</span>
          <span className="label">Câmera</span>
        </button>
        
        <button className="tool-btn" onClick={() => fileInputRef.current?.click()}>
          <span className="material-icons-round">attach_file</span>
          <span className="label">Anexar</span>
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileAttach} />
      </div>

      <div className="section-title">Meus Projetos</div>
      <div className="shortcuts-grid" style={{ marginBottom: '16px' }}>
        <a href="https://vozdaia.com/" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#9c27b0' }}><span className="material-icons-round" style={{fontSize:'16px'}}>article</span></div>
          Voz da IA
        </a>
        <a href="https://portal-ong-ashy.vercel.app/" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#e91e63' }}><span className="material-icons-round" style={{fontSize:'16px'}}>volunteer_activism</span></div>
          Portal ONG
        </a>
        <a href="https://marketplace-cd2h.vercel.app/profile" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#ff9800' }}><span className="material-icons-round" style={{fontSize:'16px'}}>storefront</span></div>
          Marketplace
        </a>
        <a href="https://buscador-processos.vercel.app/?mode=jurisprudencia" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#607d8b' }}><span className="material-icons-round" style={{fontSize:'16px'}}>gavel</span></div>
          Processos
        </a>
      </div>

            <div className="section-title">Atalhos do Google</div>
      <div className="shortcuts-grid">
        <a href="https://docs.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#4285F4' }}><span className="material-icons-round" style={{fontSize:'16px'}}>description</span></div>
          Docs
        </a>
        <a href="https://mail.google.com/tasks/canvas" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#9c27b0' }}><span className="material-icons-round" style={{fontSize:'16px'}}>task_alt</span></div>
          Tarefas
        </a>
        <a href="https://photos.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#00bcd4' }}><span className="material-icons-round" style={{fontSize:'16px'}}>photo</span></div>
          Fotos
        </a>
        <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#EA4335' }}><span className="material-icons-round" style={{fontSize:'16px'}}>mail</span></div>
          Gmail
        </a>
        <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#34A853' }}><span className="material-icons-round" style={{fontSize:'16px'}}>cloud</span></div>
          Drive
        </a>
        <a href="https://meet.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon" style={{ background: '#ff9800' }}><span className="material-icons-round" style={{fontSize:'16px'}}>video_call</span></div>
          Meet
        </a>
        <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="shortcut-item" style={{ gridColumn: '1 / -1' }}>
          <div className="shortcut-icon" style={{ background: '#FBBC05' }}><span className="material-icons-round" style={{fontSize:'16px'}}>event</span></div>
          Google Agenda
        </a>
      </div>
    </aside>
  );
}

export default LeftPanel;
