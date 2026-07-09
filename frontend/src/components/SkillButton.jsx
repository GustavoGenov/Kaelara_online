import React from 'react';

function SkillButton({ label, icon }) {
  const handleClick = () => {
    // Placeholder: aqui você pode integrar a skill correspondente
    console.log(`Skill ${label} acionada`);
  };

  return (
    <button className="skill-btn" onClick={handleClick}>
      {icon} {label}
    </button>
  );
}

export default SkillButton;
