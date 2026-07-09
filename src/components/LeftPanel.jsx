import React from 'react';

function LeftPanel() {
  return (
    <div className="glass-panel left-panel">
      <header>
        <div className="brand-title">Luminous AI</div>
        <div className="brand-subtitle">KAE V5.2 - MODERN CORE</div>
      </header>

      <div>
        <div className="widget-title">NÚCLEO CENTRAL<br/><span style={{fontSize:'8px', fontWeight:'normal'}}>OPERACIONAL</span></div>
        <div className="nav-menu">
          <div className="nav-item active">
            <span className="material-icons" style={{fontSize: '18px'}}>sync</span>
            SINCRONIA NEURAL
          </div>
          <div className="nav-item">
            <span className="material-icons" style={{fontSize: '18px'}}>face</span>
            AVATAR CONFIG
          </div>
          <div className="nav-item">
            <span className="material-icons" style={{fontSize: '18px'}}>dashboard</span>
            PAINEL TÁTICO
          </div>
          <div className="nav-item">
            <span className="material-icons" style={{fontSize: '18px'}}>description</span>
            REGISTROS
          </div>
        </div>
      </div>

      <div style={{marginTop: 'auto'}}>
        <div className="matriz-emocional-widget">
          <div className="widget-title">MATRIZ EMOCIONAL</div>
          <div className="widget-stats">
            <div className="stat-box">
              <span className="stat-label">Serenidade</span>
              <span className="stat-value">92%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Foco</span>
              <span className="stat-value">88%</span>
            </div>
          </div>
        </div>

        <div className="nav-item" style={{justifyContent: 'center', marginBottom: '16px'}}>
          <span className="material-icons" style={{fontSize: '18px'}}>tune</span>
          DIAGNÓSTICOS
        </div>

        <button className="btn-primary" style={{width: '100%'}}>OTIMIZAR LINK</button>
      </div>
    </div>
  );
}

export default LeftPanel;
