/**
 * ============================================================================
 * KAELARA A.I — PONTO DE ENTRADA DO CLIENTE WEB (VITE + REACT)
 * ============================================================================
 * Inicializa a raiz React 19, injeta os estilos globais de interface e gerencia
 * o roteamento básico via hash URL (#audit para Painel de Auditoria e padrão para App).
 * 
 * @module frontend/src/main
 */

import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AuditPage from './AuditPage.jsx';

/**
 * Componente de roteamento de nível superior baseado no hash da URL.
 * Permite alternar dinamicamente entre a interface conversacional principal
 * e o portal administrativo de auditoria técnica da Kaelara.
 * 
 * @returns {React.JSX.Element} A visualização correspondente à rota ativa.
 */
function RootRouter() {
  const [isAudit, setIsAudit] = useState(window.location.hash === '#audit');

  useEffect(() => {
    /**
     * Sincroniza o estado de visualização sempre que o hash da janela for alterado.
     */
    const handleHashChange = () => {
      setIsAudit(window.location.hash === '#audit');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return isAudit ? <AuditPage /> : <App />;
}

// Renderização na raiz da DOM sob modo estrito para prevenção de efeitos colaterais
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
