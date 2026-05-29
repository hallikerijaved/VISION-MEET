import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gd } from '../utils/api';
import Navigation from '../components/Navigation';

const MyGDs = ({ user }) => {
  const [myGDs, setMyGDs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyGDs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyGDs = async () => {
    try {
      const response = await gd.getConducted();
      setMyGDs(response.data);
    } catch (error) {
      console.error('Error fetching my GDs:', error);
    }
  };

  const handleJoinGD = async (gdId, roomId) => {
    try {
      await gd.join(gdId);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining GD:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative'
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Navigation user={user} />
      
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
        
        {/* Header section */}
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              My Discussions
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>
              Track and manage your created or joined group sessions.
            </p>
          </div>
          <button
            onClick={() => navigate('/create-gd')}
            style={{ 
              padding: '0.85rem 1.5rem', 
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '14px', 
              cursor: 'pointer', 
              fontSize: '0.95rem', 
              fontWeight: '700',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            + Create New GD
          </button>
        </div>

        {myGDs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '6rem 2rem', 
            background: 'rgba(255, 255, 255, 0.03)', 
            borderRadius: '32px', 
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>💬</div>
            <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>No discussions yet</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.1rem' }}>Start your first group discussion to see it here!</p>
            <button
              onClick={() => navigate('/create-gd')}
              style={{ padding: '1rem 2rem', background: '#334155', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: '700' }}
            >
              🚀 Launch First Session
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {myGDs.map((gdItem) => (
              <div 
                key={gdItem._id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '2rem', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ 
                        background: gdItem.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                        color: gdItem.isActive ? '#4ade80' : '#94a3b8', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: '100px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        border: `1px solid ${gdItem.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`
                      }}>
                        {gdItem.isActive ? '● LIVE SESSION' : 'ENDED'}
                      </span>
                      {gdItem.moderator._id === user.id && (
                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '0.35rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          MODERATOR
                        </span>
                      )}
                    </div>
                    
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem', fontWeight: '800' }}>
                      {gdItem.title}
                    </h3>
                    
                    <p style={{ color: '#94a3b8', margin: '0 0 1.25rem 0', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '600px' }}>
                      {gdItem.description || 'No description provided for this session.'}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"></path></svg>
                        {gdItem.participants.length} / {gdItem.maxParticipants}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {new Date(gdItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '140px' }}>
                    {gdItem.isActive ? (
                      <button
                        onClick={() => handleJoinGD(gdItem._id, gdItem.roomId)}
                        style={{ 
                          padding: '0.85rem 1.25rem', 
                          background: '#6366f1', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '14px', 
                          cursor: 'pointer', 
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
                      >
                        Rejoin Now
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/dashboard/results/${gdItem.roomId}`)}
                          style={{ 
                            padding: '0.85rem 1.25rem', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: '#818cf8', 
                            border: '1px solid rgba(99, 102, 241, 0.2)', 
                            borderRadius: '14px', 
                            cursor: 'pointer', 
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                            e.currentTarget.style.borderColor = '#818cf8';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                          }}
                        >
                          View Report
                        </button>
                        <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' }}>
                          SESSION ENDED
                        </div>
                      </>
                    )}
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

export default MyGDs;
