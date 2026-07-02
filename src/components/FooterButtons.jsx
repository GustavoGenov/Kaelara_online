import React from 'react';

function FooterButtons() {
  const handleDisclaimer = () => {
    alert('Aviso Legal:\nEste aplicativo está em fase de testes. Pode conter erros. Dados pessoais são tratados de acordo com a Lei Geral de Proteção de Dados (LGPD). Use por sua conta e risco.');
  };

  const handleFeedback = () => {
    window.location.href = 'mailto:nicholaigenov@gmail.com?subject=Feedback%20Kaelara';
  };

  const handleSearch = () => {
    const query = prompt('Digite o termo de busca:');
    if (query) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
      <button onClick={handleDisclaimer}>🚨 Disclaimer</button>
      <button onClick={handleFeedback}>✉️ Feedback</button>
      <button onClick={handleSearch}>🔎 Pesquise na Internet</button>
    </div>
  );
}

export default FooterButtons;
