import React, { useState } from 'react';
import AuditPanel from './components/AuditPanel';

const AUDIT_PIN = '2506'; // Troque este código para o PIN que preferir

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://kaelara-online.onrender.com';

function AuditPage() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [insights, setInsights] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (pin === AUDIT_PIN) {
      setUnlocked(true);
      setError('');
      await loadData();
    } else {
      setError('PIN incorreto. Tente novamente.');
      setPin('');
    }
  };

  const loadData = async (query = '') => {
    try {
      const [histRes, insRes] = await Promise.all([
        fetch(`${API_BASE}/api/history${query ? `?q=${encodeURIComponent(query)}` : ''}`),
        fetch(`${API_BASE}/api/insights`),
      ]);
      const histData = await histRes.json();
      const insData = await insRes.json();
      if (histRes.ok) setHistoryItems(histData.items || []);
      if (insRes.ok) setInsights(insData);
      setLoaded(true);
    } catch (err) {
      console.error(err);
      setLoaded(true);
    }
  };

  const loadSession = async (sessionId) => {
    window.open(`${API_BASE}/api/history/${sessionId}`, '_blank');
  };

  if (!unlocked) {
    return (
      <div className="audit-login-screen">
        <div className="audit-login-card glass-panel">
          <div className="audit-login-icon">
            <span className="material-icons" style={{ fontSize: '48px', color: 'var(--accent)' }}>lock</span>
          </div>
          <h2 className="audit-login-title">Área Restrita</h2>
          <p className="audit-login-sub">Painel de auditoria da Kaelara — acesso exclusivo do administrador.</p>
          <form onSubmit={handleUnlock} className="audit-login-form">
            <input
              type="password"
              placeholder="Digite o PIN de acesso"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="audit-pin-input"
              maxLength={8}
              autoFocus
            />
            {error && <p className="audit-login-error">{error}</p>}
            <button type="submit" className="btn-primary audit-login-btn">
              Acessar Auditoria
            </button>
          </form>
          <a href="/" className="audit-back-link">← Voltar à interface</a>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-page-shell">
      <header className="audit-page-header glass-panel">
        <div className="audit-page-brand">
          <span className="material-icons" style={{ color: 'var(--accent)' }}>analytics</span>
          <div>
            <span className="section-label">Kaelara — Painel Exclusivo</span>
            <h1 style={{ margin: 0, fontSize: '18px' }}>Auditoria Completa</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {loaded ? `${historyItems.length} conversas carregadas` : 'Carregando...'}
          </span>
          <a href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
            ← Interface Principal
          </a>
        </div>
      </header>

      <main className="audit-page-content">
        <AuditPanel
          historyItems={historyItems}
          historyQuery={historyQuery}
          insights={insights}
          onLoadSession={loadSession}
          onRefreshHistory={() => loadData(historyQuery)}
          onSearchHistory={(value) => {
            setHistoryQuery(value);
            loadData(value);
          }}
        />
      </main>
    </div>
  );
}

export default AuditPage;
