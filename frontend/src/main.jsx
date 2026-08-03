import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuditPage from './AuditPage.jsx'

// Roteamento: só abre a auditoria se o hash for exatamente #audit
// Nunca usa pathname para evitar conflito com rotas do Vercel
const isAudit = window.location.hash === '#audit';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAudit ? <AuditPage /> : <App />}
  </StrictMode>,
)
