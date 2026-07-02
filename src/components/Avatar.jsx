import React from 'react';

function Avatar() {
  // O avatar é um vídeo .webm que pode ser trocado, exceto pela região do rosto da Kae.
  // Para modificar outras partes da interface basta substituir os arquivos em src/static.
  const avatarSrc = require('./static/Kaelara.png');

  return (
    <div className="avatar-container" style={{ marginBottom: '1.5rem' }}>
      <video
        src={avatarSrc}
        autoPlay
        loop
        muted
        style={{ width: '100%', borderRadius: '8px' }}
      />
    </div>
  );
}

export default Avatar;
