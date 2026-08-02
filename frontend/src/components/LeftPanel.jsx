import React from 'react';

const shortcuts = [
  { title: 'Drive', url: 'https://drive.google.com/' },
  { title: 'Meet', url: 'https://meet.google.com/' },
  { title: 'Docs', url: 'https://docs.google.com/' },
  { title: 'Agenda', url: 'https://calendar.google.com/' },
];

function LeftPanel({
  activeView,
  historyCount,
  insights,
  onNewChat,
  onRefreshHistory,
  onRunDiagnostics,
  setActiveView,
  theme,
  toggleTheme,
}) {
  const menuItems = [
    { id: 'chat', icon: 'forum', label: 'Conversa' },
    { id: 'memory', icon: 'history', label: `Memória (${historyCount})` },
    { id: 'audit', icon: 'analytics', label: 'Auditoria' },
    { id: 'diagnostics', icon: 'monitor_heart', label: 'Diagnóstico' },
  ];

  return (
    <aside className="glass-panel left-panel">
      <div className="panel-section">
        <div className="brand-block">
          <span className="brand-badge">Kaelara online</span>
          <h1>Interface viva, memoria real e comandos uteis.</h1>
          <p>
            Conversa persistente, busca de historico e recursos prontos para crescer sem perder o visual atual.
          </p>
        </div>

        <button className="btn-primary" onClick={onNewChat}>
          Nova conversa
        </button>
      </div>

      <div className="panel-section">
        <div className="section-label">Navegacao</div>
        <div className="nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span className="material-icons">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="section-label">Atalhos reais</div>
        <div className="shortcut-list">
          {shortcuts.map((shortcut) => (
            <a key={shortcut.title} href={shortcut.url} target="_blank" rel="noreferrer" className="shortcut-card">
              <span>{shortcut.title}</span>
              <span className="material-icons">north_east</span>
            </a>
          ))}
        </div>
      </div>

      <div className="panel-section left-footer">
        <div className="mini-stat-grid">
          <div className="mini-stat-card">
            <span className="mini-stat-label">Sessoes</span>
            <strong>{insights?.total_sessions ?? 0}</strong>
          </div>
          <div className="mini-stat-card">
            <span className="mini-stat-label">Mensagens</span>
            <strong>{insights?.total_messages ?? 0}</strong>
          </div>
        </div>

        <div className="utility-row">
          <button className="btn-secondary" onClick={toggleTheme} type="button">
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
          <button className="btn-secondary" onClick={onRefreshHistory} type="button">
            Atualizar memoria
          </button>
        </div>

        <button className="btn-secondary wide" onClick={onRunDiagnostics} type="button">
          Verificar funcoes ativas
        </button>
      </div>
    </aside>
  );
}

export default LeftPanel;
