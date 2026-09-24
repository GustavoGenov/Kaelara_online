/**
 * ============================================================================
 * KAELARA A.I — PAINEL DE AUDITORIA, TELEMETRIA & GERENCIAMENTO COGNITIVO
 * ============================================================================
 * Dashboard completo contendo abas de:
 * 1. Conversas: Listagem, busca e expansão de diálogos detalhados.
 * 2. Telemetria de Visitas: Monitoramento de tráfego, dispositivos e endpoints.
 * 3. Memórias: Itens de memória de longo prazo aprendidos pela Kaelara.
 * 4. Perfis de Usuários: Preferências e nomes memorizados.
 * 5. Explorador RAG: Teste interativo de busca semântica na base de conhecimento.
 * 6. Insights & Métricas: Taxas de engajamento, sessões únicas e volume total.
 * 
 * @module frontend/src/components/AuditPanel
 */

import React, { useState } from 'react';

/**
 * Componente do painel analítico administrativo de auditoria.
 * 
 * @param {Object} props - Propriedades do painel de auditoria.
 * @returns {React.JSX.Element} Interface com abas de diagnóstico e tabelas.
 */
function AuditPanel({
  historyItems,
  historyQuery,
  insights,
  visitsData,
  memoriesData = [],
  profilesData = [],
  onLoadSession,
  onDeleteSession,
  onRefreshHistory,
  onSearchHistory,
}) {
  const [activeTab, setActiveTab] = useState('conversations');
  const [expandedSession, setExpandedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Estado para busca e inspeção do mecanismo de RAG
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    (['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://127.0.0.1:5000'
      : 'https://kaelara-online.onrender.com');

  /**
   * Executa busca semântica de teste nos embeddings de conhecimento da Kaelara.
   * 
   * @param {React.FormEvent} [e] - Evento de submissão do formulário.
   */
  const handleSearchRag = async (e) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim()) return;
    setRagLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/rag/search?q=${encodeURIComponent(ragQuery)}&limit=5`);
      const data = await res.json();
      setRagResults(data.results || []);
    } catch (err) {
      console.error('Erro na busca RAG:', err);
    } finally {
      setRagLoading(false);
    }
  };

  /**
   * Expande ou recolhe o histórico de mensagens individuais de uma sessão específica.
   * 
   * @param {string} sessionId - ID da sessão selecionada.
   */
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
        <button
          className={`audit-tab-btn ${activeTab === 'rag_memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('rag_memory')}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>psychology</span>
          Memória & Base RAG ({memoriesData.length} memórias)
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

      {/* ABA 3: MEMÓRIA & BASE RAG */}
      {activeTab === 'rag_memory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status do RAG & Conhecimento */}
          <div className="audit-history-item" style={{ background: 'var(--glass-bg)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--primary-pink)' }}>
                Status do Motor RAG & Base de Conhecimento
              </h3>
              <span className="audit-badge" style={{ background: insights?.rag_info?.local_connected ? 'rgba(46, 125, 50, 0.15)' : 'rgba(2, 136, 209, 0.15)', color: insights?.rag_info?.local_connected ? '#2e7d32' : '#0288d1' }}>
                {insights?.rag_info?.local_connected ? '✅ Acervo Local Conectado (E:\\...)' : '☁️ Acervo Nuvem Integrado'}
              </span>
            </div>
            
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              A Kaelara possui acesso permanente a <strong>{insights?.rag_info?.total_documents_catalog || 705} documentos</strong> e manuais especializados catalogados em <strong>{insights?.rag_info?.categories_count || 20} áreas de conhecimento</strong>, além de seu documento de Autoconhecimento Operacional ({insights?.rag_info?.autoconhecimento_sections || 10} seções cognitivas ativas).
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(insights?.rag_info?.categories || []).map((cat) => (
                <span key={cat} className="audit-badge" style={{ background: 'rgba(247, 141, 167, 0.12)', color: 'var(--text-main)', fontSize: '11px' }}>
                  📚 {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Teste de Busca no RAG */}
          <div className="audit-history-item" style={{ background: 'var(--glass-bg)', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700 }}>
              Testar Busca Semântica no RAG em Tempo Real
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Digite qualquer termo (ex: "cardiologia", "criador", "enfermagem", "cuidador de idosos", "capacidades") para visualizar o que o RAG entrega à Kaelara antes dela responder:
            </p>
            <form onSubmit={handleSearchRag} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Ex: o que temos sobre cardiologia?"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                className="audit-search-input"
                style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)' }}
              />
              <button type="submit" className="audit-btn-action" style={{ padding: '8px 16px' }} disabled={ragLoading}>
                <span className="material-icons" style={{ fontSize: '16px' }}>search</span>
                {ragLoading ? 'Buscando...' : 'Consultar RAG'}
              </button>
            </form>

            {ragResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ragResults.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--primary-pink)' }}>{r.title}</strong>
                      <span className="audit-badge audit-badge-endpoint">{r.category}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                      {r.content}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Fonte: {r.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memórias Permanentes do Criador Gustavo */}
          <div className="audit-history-item" style={{ background: 'var(--glass-bg)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Memória Permanente do Criador (Pai / Diretor Gustavo)
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Total de {memoriesData.length} memórias persistidas no banco de dados
                </span>
              </div>
              <button onClick={onRefreshHistory} className="audit-btn-action" title="Recarregar memórias">
                <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
                Atualizar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {memoriesData.map((m) => (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-pink)', textTransform: 'uppercase' }}>
                      {m.category} / {m.key}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDate(m.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Perfis de Usuários Registrados */}
          <div className="audit-history-item" style={{ background: 'var(--glass-bg)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Perfis de Usuários Registrados
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Total de {profilesData.length} perfis criados e identificados no banco
                </span>
              </div>
              <button onClick={onRefreshHistory} className="audit-btn-action" title="Recarregar perfis">
                <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
                Atualizar
              </button>
            </div>

            {profilesData.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Nenhum perfil de usuário registrado ainda.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {profilesData.map((p) => (
                  <div key={p.id || p.username} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="material-icons" style={{ fontSize: '18px', color: 'var(--primary-pink)' }}>
                        {p.username === 'gustavo' ? 'workspace_premium' : 'account_circle'}
                      </span>
                      <strong style={{ fontSize: '13px' }}>{p.display_name}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>Usuário: <code>{p.username}</code></span>
                      <span>Criado em: {formatDate(p.created_at)}</span>
                      {p.updated_at && <span>Última atividade: {formatDate(p.updated_at)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditPanel;
