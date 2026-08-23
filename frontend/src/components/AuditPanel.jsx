import React, { useEffect, useRef, useState } from 'react';

function AuditPanel({ historyItems, historyQuery, insights, totalVisits, onLoadSession, onRefreshHistory, onSearchHistory }) {
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);

  const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://127.0.0.1:5000'
    : 'https://kaelara-online.onrender.com';

  const loadSessionDetail = async (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      setSessionDetail(null);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/history/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setSessionDetail(data);
        setExpandedSession(sessionId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="audit-panel">
      {/* Stats strip */}
      <div className="audit-stats-strip">
        <div className="audit-stat">
          <span className="audit-stat-value">{insights?.total_sessions ?? 0}</span>
          <span className="audit-stat-label">Sessões</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value">{insights?.total_messages ?? 0}</span>
          <span className="audit-stat-label">Mensagens</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
            {insights?.last_provider ?? '--'}
          </span>
          <span className="audit-stat-label">Último LLM</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value" style={{ color: 'var(--neon-pink)' }}>
            {totalVisits}
          </span>
          <span className="audit-stat-label">Total Visitas (Web)</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="audit-search-bar">
        <span className="material-icons audit-search-icon">search</span>
        <input
          type="search"
          placeholder="Pesquisar histórico..."
          value={historyQuery}
          onChange={(e) => onSearchHistory(e.target.value)}
        />
        <button onClick={onRefreshHistory} className="audit-refresh-btn" title="Atualizar dados">
          <span className="material-icons">refresh</span>
        </button>
      </div>

      {/* History List */}
      <div className="audit-history-list">
        {historyItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhum histórico encontrado.
          </div>
        ) : (
          historyItems.map((item) => (
            <div key={item.session_id} className="audit-history-item">
              <div
                className="audit-history-header"
                onClick={() => loadSessionDetail(item.session_id)}
              >
                <div style={{ flex: 1 }}>
                  <h3 className="audit-history-title">{item.title}</h3>
                  <p className="audit-history-preview">{item.preview}</p>
                </div>
                <div className="audit-history-meta">
                  <span className="audit-history-count">{item.message_count} msgs</span>
                  <span className="audit-history-date">{formatDate(item.updated_at)}</span>
                  <span className="material-icons" style={{ color: 'var(--text-muted)' }}>
                    {expandedSession === item.session_id ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>
              {expandedSession === item.session_id && (
                <div className="audit-history-body">
                  {sessionDetail ? (
                    <div className="audit-messages">
                      {sessionDetail.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`audit-msg ${msg.role === 'user' ? 'audit-msg-user' : 'audit-msg-kae'}`}
                        >
                          <span className="audit-msg-author">
                            {msg.role === 'user' ? 'Usuário' : 'Kaelara'}
                            {msg.provider && msg.provider !== 'client' && ` (${msg.provider})`}
                          </span>
                          <div className="audit-msg-content">{msg.content}</div>
                          <span className="audit-msg-time">{formatDate(msg.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Carregando detalhes...</div>
                  )}
                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <button className="btn-secondary" onClick={() => onLoadSession(item.session_id)}>
                      Ver raw JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditPanel;
