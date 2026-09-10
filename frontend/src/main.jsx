import React, { useState, useEffect, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuditPage from './AuditPage.jsx'

function RootRouter() {
  const [isAudit, setIsAudit] = useState(window.location.hash === '#audit');

  useEffect(() => {
    const handleHashChange = () => {
      setIsAudit(window.location.hash === '#audit');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return isAudit ? <AuditPage /> : <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
)
