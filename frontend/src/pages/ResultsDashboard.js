import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import api from '../utils/api';

const ResultsDashboard = ({ user }) => {
  const { gdId } = useParams();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get(`/evaluation/session/${gdId}`);
        setEvaluations(response.data);
      } catch (error) {
        console.error('Error fetching session results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [gdId]);

  const sc = s => s >= 75 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
        <p style={{ fontWeight: '700', letterSpacing: '0.05em' }}>FETCHING SESSION DATA...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative'
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Navigation user={user} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
        
        <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'inline-flex', padding: '0.6rem 1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '100px', color: '#818cf8', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              🏆 SESSION LEADERBOARD
            </div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
              Discussion Results
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Final performance metrics for room <span style={{ color: '#818cf8', fontWeight: '700' }}>{gdId}</span>
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </button>
        </div>

        {evaluations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '32px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⌛</div>
            <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>No evaluations yet</h3>
            <p style={{ color: '#64748b' }}>Evaluations will appear here once participants leave the session.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {evaluations.map((ev, index) => (
              <div 
                key={ev._id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  padding: '2rem', 
                  borderRadius: '28px', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2.5rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ 
                  width: '60px', height: '60px', background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: index === 0 ? 'white' : '#64748b', fontSize: '1.5rem', fontWeight: '900', border: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)'
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>{ev.userName}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                      <span style={{ color: '#94a3b8' }}>Contributions:</span> {ev.messageCount}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                      <span style={{ color: '#94a3b8' }}>Time:</span> {Math.round(ev.speakingTime)}s
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: sc(ev.scores.finalScore) }}>{ev.scores.finalScore}</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/evaluations`)}
                    style={{ padding: '0.8rem 1.25rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDashboard;
