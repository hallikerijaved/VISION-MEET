import React from 'react';
import Navigation from '../components/Navigation';

const ResumeBuilder = ({ user }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f8' }}>
      <Navigation user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <iframe 
          src="/AI-Resume-Builder/index.html" 
          title="AI Resume Builder"
          style={{ width: '100%', flex: 1, border: 'none' }}
        />
      </div>
    </div>
  );
};

export default ResumeBuilder;
