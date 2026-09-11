import React, { useState } from 'react';

function AuditPanel({
  historyItems,
  historyQuery,
  insights,
  visitsData,
  onLoadSession,
  onDeleteSession,
  onRefreshHistory,
  onSearchHistory,
}) {
  const [activeTab, setActiveTab] = useState('conversations');
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    (['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://127.0.0.1:5000'
      : 'https://kaelara-online.onrender.com');

  const loadSessionDetail = async (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      setSessionDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_BASE}/api/history/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setSessionDetail(data);
        setExpandedSession(sessionId);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da sessão:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseDevice = (ua = '') => {
    if (!ua) return '💻 Desktop';
    if (/android/i.test(ua)) return '📱 Android';
    if (/iphone|ipad|ipod/i.test(ua)) return '📱 iOS';
    if (/mobile/i.test(ua)) return '📱 Mobile';
    return '💻 Desktop';
  };

  const parseBrowser = (ua = '') => {
    if (!ua) return 'Navegador';
    if (/edg/i.test(ua)) return 'Edge';
    if (/chrome|crios/i.test(ua)) return 'Chrome';
    if (/firefox|fxios/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua)) return 'Safari';
    if (/opera|opr/i.test(ua)) return 'Opera';
    return 'Web';
  };

  const exportSessionText = (item) => {
    if (!sessionDetail || sessionDetail.session_id !== item.session_id) return;
    let txt = `========================================================\n`;
    txt += `KAELARA A.I - AUDITORIA DE CONVERSA\n`;
    txt += `Título: ${item.title}\n`;
    txt += `ID da Sessão: ${item.session_id}\n`;
    txt += `Data da Conversa: ${formatDate(item.updated_at)}\n`;
    txt += `========================================================\n\n`;

    sessionDetail.messages.forEach((msg) => {
      const author = msg.role === 'user' ? 'USUÁRIO' : `KAELARA [${msg.provider || 'gemini'}]`;
      txt += `[${formatDate(msg.created_at)}] ${author}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaelara_conversa_${item.session_id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalVisits = visitsData?.total_visits ?? insights?.total_visits ?? 0;
  const uniqueVisitors = visitsData?.unique_visitors ?? insights?.unique_visitors ?? 0;
  const todayVisits = visitsData?.today_visits ?? insights?.today_visits ?? 0;

  return (
    <div className="audit-panel">
      {/* Cards de Métricas Principais */}
      <div className="audit-stats-strip">
        <div className="audit-stat">
          <span className="audit-stat-value" style={{ color: 'var(--primary-pink)' }}>
            {totalVisits}
          </span>
          <span className="audit-stat-label">Total Visitas (Web)</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value" style={{ color: '#0288d1' }}>
            {uniqueVisitors}
          </span>
          <span className="audit-stat-label">Visitantes Únicos</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value" style={{ color: '#2e7d32' }}>
            {todayVisits}
          </span>
          <span className="audit-stat-label">Visitas Hoje</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value">{insights?.total_sessions ?? historyItems.length}</span>
          <span className="audit-stat-label">Conversas Salvas</span>
        </div>
        <div className="audit-stat">
          <span className="audit-stat-value">{insights?.total_messages ?? 0}</span>
          <span className="audit-stat-label">Mensagens Trocadas</span>
        </div>
      </div>

      {/* Seletor de Abas */}
      <div className="audit-tabs">
        <button
          className={`audit-tab-btn ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversations')}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>chat</span>
          Conversas dos Usuários ({historyItems.length})
        </button>
        <button
          className={`audit-tab-btn ${activeTab === 'visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('visits')}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>visibility</span>
          Registro de Visitas ({visitsData?.recent?.length ?? 0} recentes)
        </button>
      </div>

      {/* ABA 1: CONVERSAS */}
      {activeTab === 'conversations' && (
        <>
          {/* Barra de Pesquisa */}
          <div className="audit-search-bar">
            <span className="material-icons audit-search-icon">search</span>
            <input
              type="search"
              placeholder="Pesquisar por palavras-chave no histórico de conversas..."
              value={historyQuery}
              onChange={(e) => onSearchHistory(e.target.value)}
              className="audit-search-input"
            />
            <button onClick={onRefreshHistory} className="audit-refresh-btn" title="Atualizar histórico">
              <span className="material-icons">refresh</span>
            </button>
          </div>

          {/* Lista de Conversas Gravadas */}
          <div className="audit-history-list">
            {historyItems.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="material-icons" style={{ fontSize: '40px', opacity: 0.5, marginBottom: '8px' }}>
                  forum
                </span>
                <p>Nenhuma conversa encontrada no banco de dados.</p>
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
                      <p className="audit-history-preview">{item.preview || 'Sem preview disponível'}</p>
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
                      {loadingDetail ? (
                        <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          Carregando mensagens do banco...
                        </div>
                      ) : sessionDetail ? (
                        <div className="audit-messages">
                          {sessionDetail.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`audit-msg ${msg.role === 'user' ? 'audit-msg-user' : 'audit-msg-kae'}`}
                            >
                              <span className="audit-msg-author">
                                <span className="material-icons" style={{ fontSize: '14px' }}>
                                  {msg.role === 'user' ? 'person' : 'smart_toy'}
                                </span>
                                {msg.role === 'user' ? 'Usuário' : 'Kaelara'}
                                {msg.provider && msg.provider !== 'client' && ` (${msg.provider})`}
                              </span>
                              <div className="audit-msg-content">{msg.content}</div>
                              <span className="audit-msg-time">{formatDate(msg.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '16px', color: 'var(--text-muted)' }}>
                          Não foi possível carregar as mensagens.
                        </div>
                      )}

                      {/* Ações da Conversa */}
                      <div className="audit-history-actions">
                        <button
                          className="audit-btn-action"
                          onClick={() => exportSessionText(item)}
                          title="Baixar conversa em arquivo de texto"
                        >
                          <span className="material-icons" style={{ fontSize: '15px' }}>file_download</span>
                          Exportar .txt
                        </button>
                        <button
                          className="audit-btn-action"
                          onClick={() => onLoadSession(item.session_id)}
                          title="Visualizar em formato JSON"
                        >
                          <span className="material-icons" style={{ fontSize: '15px' }}>code</span>
                          Ver JSON
                        </button>
                        {onDeleteSession && (
                          <button
                            className="audit-btn-action audit-btn-delete"
                            onClick={() => onDeleteSession(item.session_id)}
                            title="Excluir permanentemente esta conversa do banco"
                          >
                            <span className="material-icons" style={{ fontSize: '15px' }}>delete_forever</span>
                            Excluir Conversa
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ABA 2: VISITAS & ACESSOS */}
      {activeTab === 'visits' && (
        <div className="audit-visits-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Últimos acessos registrados no banco de dados da Kaelara:
            </span>
            <button onClick={onRefreshHistory} className="audit-btn-action" title="Atualizar dados de visitas">
              <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
              Atualizar Visitas
            </button>
          </div>

          {visitsData?.recent?.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="material-icons" style={{ fontSize: '40px', opacity: 0.5, marginBottom: '8px' }}>
                public
              </span>
              <p>Nenhuma visita registrada ainda. As visitas serão computadas assim que os usuários acessarem a plataforma!</p>
            </div>
          ) : (
            visitsData?.recent?.map((v) => (
              <div key={v.id} className="audit-visit-row">
                <div>
                  <span style={{ fontWeight: 700, display: 'block' }}>{formatDate(v.created_at)}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID #{v.id}</span>
                </div>
                <div>
                  <span className="audit-badge audit-badge-device">
                    {parseDevice(v.user_agent)}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>
                    {parseBrowser(v.user_agent)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.user_agent || 'Desconhecido'}
                  </span>
                </div>
                <div>
                  <span className="audit-badge audit-badge-endpoint">
                    {v.endpoint || '/'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                    Visitante: <code>{v.ip_hash || 'anon'}</code>
                  </span>
                  {v.referrer && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Origem: {v.referrer}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AuditPanel;
