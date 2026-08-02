import React, { useEffect, useRef, useState } from 'react';

function AuditPanel({ historyItems, historyQuery, insights, onLoadSession, onRefreshHistory, onSearchHistory }) {
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
          <span
            className="audit-stat-value"
            style={{ color: insights ? 'var(--neon-pink)' : '#999' }}
          >
            {insights ? '●' : '○'}
          </span>
          <span className="audit-stat-label">DB Status</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="audit-search-bar">
        <span className="material-icons audit-search-icon">search</span>
        <input
          type="search"
          placeholder="Buscar nas conversas..."
          value={historyQuery}
          onChange={(e) => onSearchHistory(e.target.value)}
          className="audit-search-input"
        />
        <button className="audit-refresh-btn" onClick={onRefreshHistory} title="Atualizar">
          <span className="material-icons" style={{ fontSize: '18px' }}>refresh</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="audit-timeline">
        {historyItems.length === 0 ? (
          <div className="audit-empty">
            <span className="material-icons" style={{ fontSize: '48px', opacity: 0.3 }}>history</span>
            <p>Nenhuma conversa no histórico ainda.</p>
            <p style={{ fontSize: '11px', opacity: 0.6 }}>As conversas aparecem aqui automaticamente após o banco ser conectado.</p>
          </div>
        ) : (
          historyItems.map((item, idx) => (
            <div key={item.session_id} className="audit-entry">
              <div className="audit-entry-line">
                <div className="audit-dot" />
                {idx < historyItems.length - 1 && <div className="audit-connector" />}
              </div>

              <div className="audit-entry-card glass-panel" onClick={() => loadSessionDetail(item.session_id)}>
                <div className="audit-entry-header">
                  <span className="audit-entry-title">{item.title || 'Conversa sem título'}</span>
                  <span className="audit-entry-date">{formatDate(item.updated_at)}</span>
                </div>
                <p className="audit-entry-preview">{item.preview || 'Sem preview'}</p>
                <div className="audit-entry-footer">
                  <span className="pill">{item.message_count} msg</span>
                  <span className="audit-expand-hint">
                    {expandedSession === item.session_id ? 'Fechar ▲' : 'Ver conversa ▼'}
                  </span>
                </div>

                {/* Expanded detail */}
                {expandedSession === item.session_id && sessionDetail && (
                  <div className="audit-detail" onClick={(e) => e.stopPropagation()}>
                    <div className="audit-detail-messages">
                      {(sessionDetail.messages || []).map((msg, mIdx) => (
                        <div key={mIdx} className={`audit-msg ${msg.role === 'user' ? 'audit-msg-user' : 'audit-msg-kae'}`}>
                          <span className="audit-msg-role">{msg.role === 'user' ? 'Você' : 'Kaelara'}</span>
                          <p className="audit-msg-content">{msg.content}</p>
                          <span className="audit-msg-time">{formatDate(msg.created_at)}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn-primary"
                      style={{ marginTop: '12px', width: '100%', fontSize: '12px', padding: '8px' }}
                      onClick={() => onLoadSession(item.session_id)}
                    >
                      Retomar esta conversa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AuditPanel;
