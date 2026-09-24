/**
 * ============================================================================
 * KAELARA A.I — PAINEL LATERAL ESQUERDO (AÇÕES RÁPIDAS & MEUS PROJETOS)
 * ============================================================================
 * Centraliza os controles operacionais e atalhos da interface:
 * 1. Cabeçalho de marca e alternância de tema (Claro / Escuro).
 * 2. Ações rápidas: Novo Chat, Reconhecimento de Voz, Câmera e Upload de Arquivos.
 * 3. Meus Projetos: Rede oficial integrada com favicons SVG (Jornal Arcanjo, Cursos Tech & IA, Voz da IA).
 * 4. Atalhos do Google: Acessos diretos com favicons oficiais de alta resolução.
 * 
 * @module frontend/src/components/LeftPanel
 */

import React, { useRef } from 'react';

/**
 * Propriedades esperadas pelo componente LeftPanel.
 * @typedef {Object} LeftPanelProps
 * @property {function(): void} onVoiceClick - Callback para iniciar/parar reconhecimento vocal.
 * @property {function(React.ChangeEvent<HTMLInputElement>): void} onFileAttach - Callback para captura de arquivo/imagem.
 * @property {boolean} isListening - Flag indicando se a escuta pelo microfone está ativa.
 * @property {function(): void} onCameraClick - Callback para abrir a câmera web.
 * @property {function(): void} onToggleTheme - Callback para alternar entre temas Claro e Escuro.
 * @property {boolean} isDarkMode - Estado atual do tema escuro.
 * @property {function(): void} onNewChat - Callback para iniciar uma nova conversa.
 */

/**
 * Renderiza o painel de navegação, ações rápidas e atalhos na lateral esquerda.
 * 
 * @param {LeftPanelProps} props - Propriedades do componente.
 * @returns {React.JSX.Element} Barra lateral com ferramentas e ecossistema.
 */
function LeftPanel({ onVoiceClick, onFileAttach, isListening, onCameraClick, onToggleTheme, isDarkMode, onNewChat }) {
  const fileInputRef = useRef(null);

  return (
    <aside className="glass-panel left-panel" aria-label="Painel de Ferramentas e Atalhos">
      
      {/* CABEÇALHO DA MARCA E CONTROLE DE TEMA */}
      <header className="brand-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon" aria-hidden="true">
            <span className="material-icons-round">auto_awesome</span>
          </div>
          <div>
            <div className="brand-title">Kaelara</div>
            <div className="brand-subtitle">KAELARA SUA AMIGA!</div>
          </div>
        </div>
        <button 
          className="tool-btn" 
          onClick={onToggleTheme} 
          style={{ background: 'transparent', padding: '8px', border: 'none' }} 
          title="Alternar Tema Claro / Escuro"
          aria-label="Alternar tema"
        >
          <span className="material-icons-round">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </header>

      {/* SEÇÃO 1: AÇÕES RÁPIDAS */}
      <div className="section-title">Ações Rápidas</div>
      <div className="tools-grid">
        <button className="tool-btn" onClick={onNewChat} title="Iniciar nova conversa mantendo o histórico no banco">
          <span className="material-icons-round">add_comment</span>
          <span className="label">Novo Chat</span>
        </button>

        <button 
          className="tool-btn" 
          onClick={onVoiceClick} 
          style={{ background: isListening ? '#f44336' : '', color: isListening ? '#fff' : '' }}
          title={isListening ? 'Clique para parar escuta' : 'Falar via microfone'}
        >
          <span className="material-icons-round">{isListening ? 'mic_none' : 'mic'}</span>
          <span className="label">{isListening ? 'Ouvindo...' : 'Falar'}</span>
        </button>
        
        <button className="tool-btn" onClick={onCameraClick} title="Abrir câmera para visão computacional">
          <span className="material-icons-round">videocam</span>
          <span className="label">Câmera</span>
        </button>
        
        <button className="tool-btn" onClick={() => fileInputRef.current?.click()} title="Anexar imagem ou documento">
          <span className="material-icons-round">attach_file</span>
          <span className="label">Anexar</span>
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileAttach} />
      </div>

      {/* SEÇÃO 2: MEUS PROJETOS (REDE INTEGRADA COM FAVICONS SVG) */}
      <div className="section-title">Meus Projetos</div>
      <div className="ecosystem-shortcuts">
        <a 
          href="https://jornal-arcanjo.vercel.app/" 
          target="_blank" 
          rel="noreferrer" 
          className="ecosystem-shortcut-item" 
          title="Jornal Arcanjo — Broadsheet Digital, Cultura & Notícias"
        >
          <div className="ecosystem-shortcut-icon">
            <img src="/ecosystem/arcanjo.svg" alt="Jornal Arcanjo" width="28" height="28" style={{ width: '28px', height: '28px', display: 'block' }} />
          </div>
          <div className="ecosystem-shortcut-text">
            <div className="ecosystem-shortcut-name">
              <span>Jornal Arcanjo</span>
              <span className="ecosystem-shortcut-arrow">↗</span>
            </div>
            <span className="ecosystem-shortcut-desc">Cultura, Sociedade & Memória</span>
          </div>
        </a>

        <a 
          href="https://cursos-livres-tech-ia.vercel.app/" 
          target="_blank" 
          rel="noreferrer" 
          className="ecosystem-shortcut-item" 
          title="Cursos Livres Tech & IA — Capacitação e Formação Tecnológica"
        >
          <div className="ecosystem-shortcut-icon">
            <img src="/ecosystem/cursos.svg" alt="Cursos Livres Tech & IA" width="28" height="28" style={{ width: '28px', height: '28px', display: 'block' }} />
          </div>
          <div className="ecosystem-shortcut-text">
            <div className="ecosystem-shortcut-name">
              <span>Cursos Tech &amp; IA</span>
              <span className="ecosystem-shortcut-arrow">↗</span>
            </div>
            <span className="ecosystem-shortcut-desc">Formação Aberta em IA</span>
          </div>
        </a>

        <a 
          href="https://vozdaia.com/" 
          target="_blank" 
          rel="noreferrer" 
          className="ecosystem-shortcut-item" 
          title="Voz da IA — Inteligência Artificial, Ciência & Tecnologia"
        >
          <div className="ecosystem-shortcut-icon">
            <img src="/ecosystem/vozdaia.svg" alt="Voz da IA" width="28" height="28" style={{ width: '28px', height: '28px', display: 'block' }} />
          </div>
          <div className="ecosystem-shortcut-text">
            <div className="ecosystem-shortcut-name">
              <span>Voz da IA</span>
              <span className="ecosystem-shortcut-arrow">↗</span>
            </div>
            <span className="ecosystem-shortcut-desc">Jornalismo de IA & Futuro</span>
          </div>
        </a>
      </div>

      {/* SEÇÃO 3: ATALHOS DO GOOGLE (FAVICONS OFICIAIS EM ALTA DEFINIÇÃO) */}
      <div className="section-title">Atalhos do Google</div>
      <div className="shortcuts-grid">
        <a href="https://docs.google.com" target="_blank" rel="noreferrer" className="shortcut-item" title="Google Docs">
          <div className="shortcut-icon" style={{ background: 'rgba(66, 133, 244, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=docs.google.com&sz=64" 
              alt="Docs" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Docs
        </a>

        <a href="https://mail.google.com/tasks/canvas" target="_blank" rel="noreferrer" className="shortcut-item" title="Google Tarefas">
          <div className="shortcut-icon" style={{ background: 'rgba(66, 133, 244, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=tasks.google.com&sz=64" 
              alt="Tarefas" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Tarefas
        </a>

        <a href="https://photos.google.com" target="_blank" rel="noreferrer" className="shortcut-item" title="Google Fotos">
          <div className="shortcut-icon" style={{ background: 'rgba(234, 67, 53, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=photos.google.com&sz=64" 
              alt="Fotos" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Fotos
        </a>

        <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="shortcut-item" title="Gmail">
          <div className="shortcut-icon" style={{ background: 'rgba(234, 67, 53, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=mail.google.com&sz=64" 
              alt="Gmail" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Gmail
        </a>

        <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="shortcut-item" title="Google Drive">
          <div className="shortcut-icon" style={{ background: 'rgba(52, 168, 83, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=drive.google.com&sz=64" 
              alt="Drive" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Drive
        </a>

        <a href="https://meet.google.com" target="_blank" rel="noreferrer" className="shortcut-item" title="Google Meet">
          <div className="shortcut-icon" style={{ background: 'rgba(0, 137, 123, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=meet.google.com&sz=64" 
              alt="Meet" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Meet
        </a>

        <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="shortcut-item" style={{ gridColumn: '1 / -1' }} title="Google Agenda">
          <div className="shortcut-icon" style={{ background: 'rgba(66, 133, 244, 0.1)' }}>
            <img 
              src="https://www.google.com/s2/favicons?domain=calendar.google.com&sz=64" 
              alt="Google Agenda" 
              style={{ width: '18px', height: '18px', display: 'block' }} 
            />
          </div>
          Google Agenda
        </a>
      </div>
    </aside>
  );
}

export default LeftPanel;
