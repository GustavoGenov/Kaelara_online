import React, { useState } from 'react';
import AuditPanel from './components/AuditPanel';

const AUDIT_PIN = '2506';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:5000'
    : 'https://kaelara-online.onrender.com');

function AuditPage() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [insights, setInsights] = useState(null);
  const [visitsData, setVisitsData] = useState({ total_visits: 0, unique_visitors: 0, today_visits: 0, recent: [] });
  const [memoriesData, setMemoriesData] = useState([]);
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
      const [histRes, insRes, visitsRes, memRes] = await Promise.all([
        fetch(`${API_BASE}/api/history${query ? `?q=${encodeURIComponent(query)}` : ''}`),
        fetch(`${API_BASE}/api/insights`),
        fetch(`${API_BASE}/api/visits?limit=50`),
        fetch(`${API_BASE}/api/memory`),
      ]);

      if (histRes.ok) {
        const histData = await histRes.json();
        setHistoryItems(histData.items || []);
      }
      if (insRes.ok) {
        const insData = await insRes.json();
        setInsights(insData);
      }
      if (visitsRes.ok) {
        const vData = await visitsRes.json();
        setVisitsData(vData);
      }
      if (memRes.ok) {
        const mData = await memRes.json();
        setMemoriesData(mData.items || []);
      }
      setLoaded(true);
    } catch (err) {
      console.error('Erro ao carregar dados de auditoria:', err);
      setLoaded(true);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta conversa do banco de dados?')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/history/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((item) => item.session_id !== sessionId));
        const insRes = await fetch(`${API_BASE}/api/insights`);
        if (insRes.ok) setInsights(await insRes.json());
      } else {
        alert('Erro ao excluir conversa.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    }
  };

  const loadSession = (sessionId) => {
    window.open(`${API_BASE}/api/history/${sessionId}`, '_blank');
  };

  if (!unlocked) {
    return (
      <div className="audit-login-screen">
        <div className="audit-login-card glass-panel">
          <div className="audit-login-icon">
            <span className="material-icons" style={{ fontSize: '48px', color: 'var(--primary-pink)' }}>lock</span>
          </div>
          <h2 className="audit-login-title">Área Restrita</h2>
          <p className="audit-login-sub">Painel de auditoria da Kaelara - banco de dados e tráfego em tempo real.</p>
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
          <span className="material-icons" style={{ color: 'var(--primary-pink)', fontSize: '28px' }}>analytics</span>
          <div>
            <span className="section-label">Kaelara - Inteligência & Auditoria</span>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Painel Administrativo</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {loaded ? `${historyItems.length} conversas | ${visitsData?.total_visits || 0} visitas` : 'Carregando...'}
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
          visitsData={visitsData}
          memoriesData={memoriesData}
          onLoadSession={loadSession}
          onDeleteSession={handleDeleteSession}
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
