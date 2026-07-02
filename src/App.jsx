import React from 'react';
import './index.css';
import SkillButton from './components/SkillButton';
import FooterButtons from './components/FooterButtons';
import WebcamButton from './components/WebcamButton';
import VoiceButton from './components/VoiceButton';
import CodeButton from './components/CodeButton';
import HardwareButton from './components/HardwareButton';
import DocumentButton from './components/DocumentButton';
import TermsOfUse from './components/TermsOfUse';
import FeedbackField from './components/FeedbackField';
import InternalSearch from './components/InternalSearch';
import AvatarImg from './static/Kaelara.png';
import ChatWindow from './components/ChatWindow';
import Avatar from './components/Avatar';

function App() {
  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <div className="top-right-controls">
        <TermsOfUse />
        <FeedbackField />
      </div>
      <aside className="side-panel">
        <h1 className="logo">Kaelara</h1>
        <Avatar />
        <SkillButton label="Código" icon="💻"/>
        <CodeButton />
        <DocumentButton />
        <VoiceButton />
        <WebcamButton />
        <HardwareButton />
      </aside>
      <main className="main-content">
        <ChatWindow />
        <InternalSearch />
      </main>
      <FooterButtons />
    </div>
  );
}

export default App;
