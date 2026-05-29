import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import api from '../utils/api';

const Evaluations = ({ user }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    api.get('/evaluation/my-evaluations')
      .then(response => {
        setEvaluations(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching evaluations:', error);
        setLoading(false);
      });
  }, [user, navigate]);

  const getColor = (score) => score >= 75 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const getLabel = (score) => score >= 75 ? 'Expert' : score >= 60 ? 'Proficient' : 'Learning';

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '32px',
    padding: '2.5rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    marginBottom: '2.5rem',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const metricBoxStyle = (color) => ({
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite', margin: '0 auto 1.5rem' }}></div>
        <p style={{ fontWeight: '800', letterSpacing: '0.1em', fontSize: '0.9rem', color: '#818cf8' }}>ANALYZING PERFORMANCE DATA...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Cinematic Background Blobs */}
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-15%', right: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <Navigation user={user} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem', position: 'relative', zIndex: 1 }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem 1.25rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '100px', color: '#818cf8', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            ⚡ PERFORMANCE ANALYTICS
          </div>
          <h1 style={{ color: 'white', fontSize: '3.5rem', fontWeight: '900', margin: '0 0 1rem 0', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Evaluation <span style={{ background: 'linear-gradient(to right, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>History</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '700px', lineHeight: 1.6 }}>
            Deep-dive into your communication metrics, semantic alignment, and structural insights generated across your collaborative sessions.
          </p>
        </div>

        {evaluations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '10rem 2rem', 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '48px', 
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>💎</div>
            <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.02em' }}>No Data Available Yet</h3>
            <p style={{ color: '#64748b', marginBottom: '3rem', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 3rem' }}>Participate in a Group Discussion to unlock your first high-fidelity performance profile.</p>
            <button 
              onClick={() => navigate('/browse-gds')}
              style={{ 
                padding: '1.25rem 3rem', 
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '20px', 
                cursor: 'pointer', 
                fontSize: '1.1rem', 
                fontWeight: '800',
                boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start Your First Session
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '3rem' }}>
            {evaluations.map((ev) => (
              <div key={ev._id} style={cardStyle} className="eval-card">
                <style>{`
                  .eval-card:hover { border-color: rgba(99, 102, 241, 0.3); transform: translateY(-4px); background: rgba(255, 255, 255, 0.06); }
                `}</style>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '2.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#818cf8', fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
                      SESSION RECORDED • {new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h2 style={{ color: 'white', fontSize: '2.25rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>{ev.gdTitle}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '1rem', fontWeight: '700' }}>
                        <span style={{ fontSize: '1.2rem' }}>💬</span> {ev.messageCount} Key Contributions
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '2rem 3rem', 
                    borderRadius: '32px', 
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minWidth: '180px',
                    boxShadow: '0 15px 30px -5px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: getColor(ev.scores.finalScore), lineHeight: 1, letterSpacing: '-2px' }}>
                      {ev.scores.finalScore}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.75rem' }}>
                      {getLabel(ev.scores.finalScore)} RANK
                    </div>
                  </div>
                </div>

                {/* Score Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3.5rem' }}>
                  {[
                    ['Topic Precision', ev.scores.topicRelevance, '#6366f1', '🎯'], 
                    ['Semantic Insight', ev.scores.semanticSimilarity, '#10b981', '🧠'], 
                    ['Keyword Logic', ev.scores.keywordMatching, '#f59e0b', '🔑'], 
                    ['Emotional Quotient', ev.scores.sentimentScore, '#ec4899', '🎭'],
                    ['Linguistic Quality', ev.scores.grammarQuality, '#6366f1', '✍️'],
                    ['Vocal Impact', ev.scores.communicationQuality, '#10b981', '🗣️'],
                    ['Presence', ev.scores.participationAnalysis, '#f59e0b', '🌟'],
                    ['Core Confidence', ev.scores.confidenceAnalysis, '#ec4899', '🛡️']
                  ].map(([label, val, color, icon]) => (
                    <div key={label} style={metricBoxStyle(color)}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{val}<span style={{ fontSize: '0.9rem', color: '#475569', marginLeft: '2px' }}>%</span></div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', marginTop: '1rem', overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, height: '100%', background: `linear-gradient(to right, ${color}, #fff)`, borderRadius: '3px', opacity: 0.8 }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '28px', height: '28px', background: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem' }}>✓</div>
                      <strong style={{ color: '#10b981', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: '900' }}>Strategic Strengths</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#d1fae5', fontSize: '1.05rem', lineHeight: 1.8, fontWeight: '500' }}>
                      {ev.strengths?.length > 0 ? ev.strengths.map((s, i) => <li key={i}>{s}</li>) : <li>Observation in progress...</li>}
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.04)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '28px', height: '28px', background: '#ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.9rem' }}>!</div>
                      <strong style={{ color: '#ef4444', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: '900' }}>Optimization Areas</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#fee2e2', fontSize: '1.05rem', lineHeight: 1.8, fontWeight: '500' }}>
                      {ev.weaknesses?.length > 0 ? ev.weaknesses.map((w, i) => <li key={i}>{w}</li>) : <li>Maintaining peak performance.</li>}
                    </ul>
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.08), rgba(167, 139, 250, 0.04))', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    <strong style={{ color: '#818cf8', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: '900' }}>Executive Summary & Path Forward</strong>
                  </div>
                  <p style={{ color: '#e2e8f0', margin: '0 0 2rem 0', fontSize: '1.15rem', lineHeight: 1.7, fontWeight: '600' }}>
                    {ev.feedback}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {ev.improvements?.map((imp, i) => (
                      <div key={i} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '14px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        🚀 {imp}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Evaluations;
