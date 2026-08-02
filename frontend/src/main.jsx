import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuditPage from './AuditPage.jsx'

// Simple hash-based routing: /#/audit opens the protected audit page
const isAudit = window.location.hash === '#/audit' || window.location.pathname === '/audit';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAudit ? <AuditPage /> : <App />}
  </StrictMode>,
)
