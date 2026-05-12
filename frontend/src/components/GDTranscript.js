import React, { useState } from 'react';

export default function GDTranscript({ transcript }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transcript || transcript.length === 0) {
    return <p style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic' }}>No transcript available for this participant.</p>;
  }

  return (
    <div style={{ marginTop: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}
      >
        <span>📝 View Full Transcript</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #e2e8f0' }}>
          <ul style={{ margin: '1rem 0 0 0', paddingLeft: '1.5rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {transcript.map((line, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
