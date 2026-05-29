import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gd } from '../utils/api';
import Navigation from '../components/Navigation';

const StatCard = ({ icon, value, label, color }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ 
      fontSize: '2rem', 
      background: `linear-gradient(135deg, ${color}22, ${color}44)`, 
      borderRadius: '16px', 
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `inset 0 0 0 1px ${color}33`
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.35rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{label}</div>
    </div>
  </div>
);

const ActionBtn = ({ icon, label, onClick, color, gradient }) => (
  <button onClick={onClick} style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '1.25rem',
    background: gradient || color,
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '700',
    flex: 1,
    minWidth: '140px',
    boxShadow: `0 10px 15px -3px ${color}44`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  }}
    onMouseEnter={e => { 
      e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; 
      e.currentTarget.style.boxShadow = `0 20px 25px -5px ${color}55`;
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
      e.currentTarget.style.boxShadow = `0 10px 15px -3px ${color}44`;
    }}
  >
    <div style={{ 
      fontSize: '1.5rem', 
      background: 'rgba(255, 255, 255, 0.2)', 
      borderRadius: '12px', 
      width: '44px', 
      height: '44px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>{icon}</div>
    <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{label}</span>
    <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', opacity: 0, transition: 'opacity 0.3s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0} />
  </button>
);

const MainDashboard = ({ user }) => {
  const [gds, setGds] = useState([]);
  const [conductedGDs, setConductedGDs] = useState([]);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [stats, setStats] = useState({ activeGDs: 0, totalParticipants: 0, myGDs: 0 });
  const [joiningId, setJoiningId] = useState(null);
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConducted, setShowConducted] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [res, conductedRes] = await Promise.all([gd.getAll(), gd.getConducted()]);
      const all = res.data;
      const conducted = conductedRes.data;
      const active = all.filter(g => g.isActive);
      const myGDs = all.filter(g => g.moderator._id === user.id || g.participants.some(p => p._id === user.id));
      
      setGds(active);
      setConductedGDs(conducted);
      setStats({
        activeGDs: active.length,
        totalParticipants: active.reduce((s, g) => s + g.participants.length, 0),
        myGDs: Math.max(myGDs.length, conducted.length)
      });

      // Fetch recent evaluations for the "Performance" section
      const evalRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/evaluation/my-evaluations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const evals = await evalRes.json();
      setRecentEvaluations(Array.isArray(evals) ? evals.slice(0, 3) : []);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    const keepAlive = setInterval(() => {
      fetch(`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001'}/health`).catch(() => { });
    }, 4 * 60 * 1000);
    return () => { clearInterval(interval); clearInterval(keepAlive); };
  }, [fetchData]);

  const handleJoin = async (gdId, roomId) => {
    setJoiningId(gdId); setJoinError('');
    try {
      await gd.join(gdId);
      navigate(`/room/${roomId}`);
    } catch (e) {
      setJoinError(e.response?.data?.message || 'Failed to join. Please try again.');
      setJoiningId(null);
    }
  };

  const handleCopy = (roomId) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`);
    setCopied(roomId);
    setTimeout(() => setCopied(''), 2000);
  };

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const fillPct = (g) => Math.round((g.participants.length / g.maxParticipants) * 100);
  const formatDate = (date) => new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#1e293b' }}>
      <Navigation user={user} />

      {/* Premium Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        padding: '5rem 2rem 8rem', color: 'white', position: 'relative', overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'float 20s infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 25s infinite alternate-reverse' }} />
        
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', color: '#a78bfa' }}>
                DASHBOARD V2.0
              </span>
              <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.8 }}>SYSTEM ACTIVE</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Welcome back,<br/>
              <span style={{ background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user.name}</span>
            </h1>
            <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', opacity: 0.7, maxWidth: '500px', lineHeight: 1.6 }}>
              Your personalized workspace for real-time discussions, AI evaluations, and performance tracking.
            </p>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '24px', 
            padding: '2rem', 
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '280px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#a78bfa', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quick Link</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>{stats.activeGDs}</div>
            <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Live Discussions Available</div>
            <button 
              onClick={() => navigate('/browse-gds')}
              style={{ width: '100%', padding: '1rem', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Browse All
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1150px', margin: '-4rem auto 0', padding: '0 1.5rem 5rem', position: 'relative', zIndex: 10 }}>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <StatCard icon="🎯" value={stats.activeGDs} label="Active Sessions" color="#6366f1" />
          <StatCard icon="👥" value={stats.totalParticipants} label="Live Users" color="#10b981" />
          <StatCard icon="📋" value={stats.myGDs} label="Your History" color="#f59e0b" />
          <StatCard icon="📊" value={recentEvaluations.length > 0 ? `${recentEvaluations[0].scores.finalScore}%` : 'N/A'} label="Latest Score" color="#8b5cf6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }} className="stitch-dash-main-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Quick Actions Panel */}
            <div style={{ 
              background: 'white', 
              borderRadius: '24px', 
              padding: '2rem', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ padding: '0.4rem', background: '#eef2ff', borderRadius: '8px' }}>⚡</span>
                Launch Workspace
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                <ActionBtn icon="🚀" label="Start New GD" onClick={() => navigate('/create-gd')} color="#4f46e5" gradient="linear-gradient(135deg, #4f46e5, #6366f1)" />
                <ActionBtn icon="🤖" label="AI Mock Interview" onClick={() => navigate('/interview')} color="#e11d48" gradient="linear-gradient(135deg, #e11d48, #f43f5e)" />
                <ActionBtn icon="📄" label="Resume Builder" onClick={() => navigate('/resume-builder')} color="#8b5cf6" gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" />
                <ActionBtn icon="📋" label="My Sessions" onClick={() => navigate('/my-gds')} color="#0ea5e9" gradient="linear-gradient(135deg, #0ea5e9, #38bdf8)" />
              </div>
            </div>

            {/* Live Discussions Section */}
            <div style={{ 
              background: 'white', 
              borderRadius: '24px', 
              padding: '2rem', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ padding: '0.4rem', background: '#fef2f2', borderRadius: '8px' }}>🔥</span>
                  Live Discussions
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <span style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 12px #22c55e', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>{stats.activeGDs} ONLINE</span>
                </div>
              </div>

              {joinError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fee2e2', fontWeight: '600' }}>
                  ⚠️ {joinError}
                </div>
              )}

              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <div className="stitch-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontWeight: '600' }}>Syncing global sessions...</p>
                </div>
              ) : gds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☁️</div>
                  <h3 style={{ color: '#1e293b', margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: '800' }}>The lobby is quiet</h3>
                  <p style={{ color: '#64748b', margin: '0 0 2rem', fontWeight: '500' }}>Be the one to spark a new conversation.</p>
                  <button 
                    onClick={() => navigate('/create-gd')}
                    style={{ padding: '1rem 2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
                  >
                    Host a Discussion
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {gds.map((g) => {
                    const full = g.participants.length >= g.maxParticipants;
                    const pct = fillPct(g);
                    return (
                      <div key={g._id} style={{
                        border: '1px solid #f1f5f9', borderRadius: '20px', padding: '1.5rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                        onMouseEnter={e => { 
                          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.05)'; 
                          e.currentTarget.style.borderColor = '#6366f133';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={e => { 
                          e.currentTarget.style.boxShadow = 'none'; 
                          e.currentTarget.style.borderColor = '#f1f5f9';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '280px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: '800', letterSpacing: '-0.02em' }}>{g.title}</h3>
                              <span style={{ background: full ? '#fee2e2' : '#dcfce7', color: full ? '#dc2626' : '#15803d', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.025em' }}>
                                {full ? 'SESSION FULL' : 'LIVE NOW'}
                              </span>
                            </div>
                            <p style={{ color: '#64748b', margin: '0 0 1.25rem', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: '500' }}>
                              {g.description || 'Global collaboration room. Join to share insights and participate in the discussion.'}
                            </p>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>👤 {g.moderator.name}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>👥 {g.participants.length}/{g.maxParticipants}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🕒 {timeAgo(g.createdAt)}</span>
                            </div>
                            <div style={{ marginTop: '1.25rem', background: '#f1f5f9', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#ef4444' : pct > 75 ? '#f59e0b' : 'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius: '99px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleJoin(g._id, g.roomId)}
                              disabled={full || joiningId === g._id}
                              style={{
                                padding: '0.85rem 1.75rem', fontWeight: '800', fontSize: '0.95rem',
                                background: full ? '#f1f5f9' : joiningId === g._id ? '#818cf8' : '#4f46e5',
                                color: full ? '#94a3b8' : 'white', border: 'none', borderRadius: '14px',
                                cursor: full || joiningId === g._id ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: full ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                              }}
                            >
                              {joiningId === g._id ? 'Joining...' : full ? 'Full' : 'Join Session'}
                            </button>
                            <button
                              onClick={() => handleCopy(g.roomId)}
                              style={{ 
                                width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: copied === g.roomId ? '#dcfce7' : '#f8fafc', 
                                border: '1px solid #f1f5f9', borderRadius: '14px', cursor: 'pointer', fontSize: '1.25rem', transition: 'all 0.2s' 
                              }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                            >
                              {copied === g.roomId ? '✅' : '🔗'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Sidebar: Conducted by You */}
            <div style={{ 
              background: 'white', 
              borderRadius: '24px', 
              padding: '1.75rem', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>Host History</h3>
                <button 
                  onClick={() => setShowConducted(!showConducted)}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {showConducted ? 'Collapse' : 'Expand'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {conductedGDs.slice(0, showConducted ? 10 : 3).map(g => (
                  <div key={g._id} style={{ 
                    padding: '1rem', 
                    borderRadius: '16px', 
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{g.title}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: g.isActive ? '#16a34a' : '#64748b', background: g.isActive ? '#dcfce7' : '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                        {g.isActive ? 'LIVE' : 'ENDED'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', marginBottom: '0.75rem' }}>{formatDate(g.createdAt)}</div>
                    <button 
                      onClick={() => g.isActive ? handleJoin(g._id, g.roomId) : navigate(`/dashboard/results/${g.roomId}`)}
                      style={{ width: '100%', padding: '0.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#6366f1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      {g.isActive ? 'Join Room' : 'View Results'}
                    </button>
                  </div>
                ))}
                {conductedGDs.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>No hosted sessions yet.</div>}
                {!showConducted && conductedGDs.length > 3 && (
                  <button onClick={() => setShowConducted(true)} style={{ textAlign: 'center', padding: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer' }}>+ {conductedGDs.length - 3} more</button>
                )}
              </div>
            </div>

            {/* Performance Insights Section */}
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
              borderRadius: '24px', 
              padding: '1.75rem', 
              boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.2)',
              color: 'white'
            }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.2)', borderRadius: '8px' }}>📈</span>
                Performance
              </h3>
              
              {recentEvaluations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', opacity: 0.8, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Latest Score</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: '900' }}>{recentEvaluations[0].scores.finalScore}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '700', opacity: 0.8 }}>/100</span>
                    </div>
                    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '99px' }}>
                      <div style={{ width: `${recentEvaluations[0].scores.finalScore}%`, height: '100%', background: 'white', borderRadius: '99px', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recentEvaluations.slice(0, 2).map((ev, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{ev.gdTitle}</span>
                        <span style={{ fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>{ev.scores.finalScore}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => navigate('/evaluations')}
                    style={{ width: '100%', padding: '0.85rem', background: 'white', color: '#6366f1', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '0.5rem' }}
                  >
                    Full Analytics
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', opacity: 0.8 }}>Complete a GD to unlock your performance insights.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <footer style={{ 
        background: '#0f172a', 
        padding: '5rem 2rem 3rem', 
        color: '#94a3b8',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'white', fontWeight: '900', fontSize: '1.75rem', letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
                Vision<span style={{ color: '#6366f1' }}>Meet</span>
              </div>
              <p style={{ lineHeight: 1.8, maxWidth: '400px', fontSize: '1rem' }}>
                The next generation of professional collaboration. Real-time discussions enhanced by AI evaluation and blockchain-verified certifications.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {['Twitter', 'LinkedIn', 'GitHub'].map(social => (
                  <div key={social} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <span style={{ fontSize: '1.2rem', color: 'white' }}>●</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '1.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[['Dashboard', '/dashboard'], ['Browse GDs', '/browse-gds'], ['My Sessions', '/my-gds'], ['AI Interview', '/interview']].map(([label, path]) => (
                  <li key={path} onClick={() => navigate(path)} style={{ cursor: 'pointer', transition: 'color 0.2s', fontWeight: '600' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: '800', marginBottom: '1.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resources</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Documentation', 'API Reference', 'Community', 'Status'].map(item => (
                  <li key={item} style={{ cursor: 'pointer', transition: 'color 0.2s', fontWeight: '600' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
            <span>© {new Date().getFullYear()} VisionMeet. Designed for the future of work.</span>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }}>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .stitch-dash-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @font-face {
          font-family: 'Plus Jakarta Sans';
          src: url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        }
      `}</style>
    </div>
  );
};

export default MainDashboard;
