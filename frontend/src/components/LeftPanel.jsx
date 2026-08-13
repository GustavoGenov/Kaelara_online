import React from 'react';

function LeftPanel() {
  return (
    <aside className="glass-panel left-panel">
      
      <header className="brand-header">
        <div className="brand-icon">
          <span className="material-icons-round">auto_awesome</span>
        </div>
        <div>
          <div className="brand-title">Kaelara</div>
          <div className="brand-subtitle">AI ASSISTANT</div>
        </div>
      </header>

      <div className="section-title">Ações Rápidas</div>
      <div className="tools-grid">
        <button className="tool-btn" onClick={() => alert('Recurso de voz em desenvolvimento!')}>
          <span className="material-icons-round">mic</span>
          <span className="label">Falar</span>
        </button>
        <button className="tool-btn" onClick={() => alert('Recurso de câmera em desenvolvimento!')}>
          <span className="material-icons-round">videocam</span>
          <span className="label">Câmera</span>
        </button>
        <button className="tool-btn" onClick={() => alert('Recurso de anexo em desenvolvimento!')}>
          <span className="material-icons-round">attach_file</span>
          <span className="label">Anexar</span>
        </button>
      </div>

      <div className="section-title">Atalhos do Google</div>
      <div className="shortcuts-list">
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
      </div>

      <div className="section-title" style={{marginTop: '24px'}}>Legal</div>
      <div className="shortcuts-list">
        <a href="/termos" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>gavel</span></div>
          Termos de Uso
        </a>
        <a href="/politica-de-privacidade" target="_blank" rel="noreferrer" className="shortcut-item">
          <div className="shortcut-icon"><span className="material-icons-round" style={{fontSize:'18px'}}>security</span></div>
          Política de Privacidade
        </a>
      </div>

    </aside>
  );
}

export default LeftPanel;
