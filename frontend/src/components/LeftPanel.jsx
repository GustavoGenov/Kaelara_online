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
      <div className="shortcuts-list">
        <a href="https://vozdaia.com/" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>article</span></div>
          Voz da IA
        </a>
        <a href="https://portal-ong-ashy.vercel.app/" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>volunteer_activism</span></div>
          Portal ONG
        </a>
        <a href="https://marketplace-cd2h.vercel.app/profile" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>storefront</span></div>
          Marketplace
        </a>
        <a href="https://buscador-processos.vercel.app/?mode=jurisprudencia" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>gavel</span></div>
          Buscador de Processos
        </a>
      </div>

      <div className="section-title">Atalhos do Google</div>
      <div className="shortcuts-list" style={{marginBottom: '20px'}}>
        <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>mail</span></div>
          Gmail
        </a>
        <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>cloud</span></div>
          Google Drive
        </a>
        <a href="https://meet.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>video_call</span></div>
          Google Meet
        </a>
        <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>event</span></div>
          Google Agenda
        </a>
        <a href="https://docs.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>description</span></div>
          Google Docs
        </a>
        <a href="https://mail.google.com/tasks/canvas" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>task_alt</span></div>
          Google Tarefas
        </a>
        <a href="https://photos.google.com" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>photo</span></div>
          Google Fotos
        </a>
      </div>
    </aside>
  );
}

export default LeftPanel;
