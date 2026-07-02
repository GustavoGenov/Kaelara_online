// src/components/WebcamButton.jsx
import React, { useRef, useState } from 'react';

function WebcamButton() {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);

  const handleClick = async () => {
    if (!active) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setActive(true);
      } catch (err) {
        console.error('Erro ao acessar webcam:', err);
        alert('Não foi possível acessar a webcam. Verifique permissões.');
      }
    } else {
      // Desativar webcam
      const tracks = videoRef.current?.srcObject?.getTracks();
      tracks?.forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setActive(false);
    }
  };

  return (
    <div className="webcam-section" style={{ marginTop: '1rem' }}>
      <button onClick={handleClick} className="skill-btn">
        {active ? '📹 Desligar Webcam' : '📹 Ligar Webcam'}
      </button>
      {active && (
        <video ref={videoRef} autoPlay style={{ width: '100%', marginTop: '0.5rem', borderRadius: '8px' }} />
      )}
    </div>
  );
}

export default WebcamButton;
