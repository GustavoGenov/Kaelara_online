/**
 * ============================================================================
 * KAELARA A.I — PÁGINA DE AUDITORIA ADMINISTRATIVA (#audit)
 * ============================================================================
 * Tela de acesso restrito por PIN de segurança (2506) para engenharia e suporte:
 * 1. Autenticação local pré-carregamento.
 * 2. Visualização em tempo real de sessões ativas, mensagens e memórias.
 * 3. Telemetria e mapa de visitas de usuários (dispositivo, referrers, endpoints).
 * 4. Métricas de engajamento do RAG, perfis cognitivos persistidos e insights.
 * 5. Gerenciamento e purga segura de sessões do banco de dados.
 * 
 * @module frontend/src/AuditPage
 */

import React, { useState } from 'react';
import AuditPanel from './components/AuditPanel';

/** PIN de segurança para desbloqueio do painel administrativo */
const AUDIT_PIN = '2506';

/** Endpoint da API backend (Render ou local) */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:5000'
    : 'https://kaelara-online.onrender.com');

/**
 * Componente da página de auditoria completa da Kaelara.
 * 
 * @returns {React.JSX.Element} Tela de login por PIN ou dashboard analítico desbloqueado.
 */
function AuditPage() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [insights, setInsights] = useState(null);
  const [visitsData, setVisitsData] = useState({ total_visits: 0, unique_visitors: 0, today_visits: 0, recent: [] });
  const [memoriesData, setMemoriesData] = useState([]);
  const [profilesData, setProfilesData] = useState([]);
  const [loaded, setLoaded] = useState(false);

  /**
   * Valida o PIN fornecido contra a constante de segurança.
   * 
   * @param {React.FormEvent} e - Evento de submissão do formulário.
   */
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

  /**
   * Executa requisições paralelas para carregar todos os dados de telemetria e banco de dados.
   * 
   * @param {string} [query=''] - Termo opcional para filtro no histórico de conversas.
   */
  const loadData = async (query = '') => {
    try {
      const [histRes, insRes, visitsRes, memRes, profRes] = await Promise.all([
        fetch(`${API_BASE}/api/history${query ? `?q=${encodeURIComponent(query)}` : ''}`),
        fetch(`${API_BASE}/api/insights`),
        fetch(`${API_BASE}/api/visits?limit=50`),
        fetch(`${API_BASE}/api/memory`),
        fetch(`${API_BASE}/api/profiles`),
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
      if (profRes && profRes.ok) {
        const pData = await profRes.json();
        setProfilesData(pData.items || []);
      }
      setLoaded(true);
    } catch (err) {
      console.error('Erro ao carregar dados de auditoria:', err);
      setLoaded(true);
    }
  };

  /**
   * Remove permanentemente uma sessão e suas mensagens associadas do banco.
   * 
   * @param {string} sessionId - Identificador único da sessão a ser expurgada.
   */
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

  /**
   * Abre os dados brutos JSON da sessão em nova aba para inspeção técnica profunda.
   * 
   * @param {string} sessionId - ID da sessão.
   */
  const loadSession = (sessionId) => {
    window.open(`${API_BASE}/api/history/${sessionId}`, '_blank');
  };

  // Seção bloqueada: renderiza formulário de PIN
  if (!unlocked) {
    return (
      <div className="audit-login-screen">
        <div className="audit-login-card glass-panel">
          <div className="audit-login-icon">
            <span className="material-icons" style={{ fontSize: '48px', color: 'var(--primary-pink)' }}>lock</span>
          </div>
          <h2 className="audit-login-title">Área Restrita</h2>
          <p className="audit-login-sub">Painel de auditoria da Kaelara — telemetria, memórias e banco em tempo real.</p>
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

  // Dashboard de auditoria desbloqueado
  return (
    <div className="audit-page-shell">
      <header className="audit-page-header glass-panel">
        <div className="audit-page-brand">
          <span className="material-icons" style={{ color: 'var(--primary-pink)', fontSize: '28px' }}>analytics</span>
          <div>
            <span className="section-label">Kaelara — Inteligência &amp; Auditoria</span>
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
          profilesData={profilesData}
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
