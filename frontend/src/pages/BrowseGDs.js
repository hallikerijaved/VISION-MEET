import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gd } from '../utils/api';
import Navigation from '../components/Navigation';

const BrowseGDs = ({ user }) => {
  const [gds, setGds] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, my
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGDs();
  }, []);

  const fetchGDs = async () => {
    try {
      const response = await gd.getAll();
      setGds(response.data);
    } catch (error) {
      console.error('Error fetching GDs:', error);
    }
  };

  const [joiningId, setJoiningId] = useState(null);
  const [joinError, setJoinError] = useState('');

  const handleJoinGD = async (gdId, roomId) => {
    setJoiningId(gdId);
    setJoinError('');
    try {
      await gd.join(gdId);
      navigate(`/room/${roomId}`);
    } catch (error) {
      setJoinError(error.response?.data?.message || 'Failed to join. Please try again.');
      setJoiningId(null);
    }
  };

  const filteredGDs = gds.filter(gdItem => {
    const matchesSearch = gdItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gdItem.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'active':
        return matchesSearch && gdItem.isActive;
      case 'my':
        return matchesSearch && (gdItem.moderator._id === user.id || gdItem.participants.some(p => p._id === user.id));
      default:
        return matchesSearch;
    }
  });

  const inputStyle = {
    padding: '0.85rem 1.25rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    fontSize: '0.95rem',
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    flex: 1
  };

  const selectStyle = {
    padding: '0.85rem 1.25rem',
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    fontSize: '0.95rem',
    color: 'white',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit'
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Browse Discussions
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>
              Discover active sessions and join the global conversation.
            </p>
          </div>
          <button
            onClick={() => navigate('/create-gd')}
            style={{ 
              padding: '1rem 2rem', 
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '16px', 
              cursor: 'pointer', 
              fontSize: '1rem', 
              fontWeight: '700',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Start New Discussion
          </button>
        </div>

        {joinError && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            padding: '1rem 1.5rem', 
            borderRadius: '16px', 
            marginBottom: '2rem', 
            fontSize: '0.9rem', 
            fontWeight: '600',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span>⚠️</span> {joinError}
          </div>
        )}
        
        {/* Filters and Search */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center', 
          marginBottom: '2.5rem', 
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '1.25rem',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by topic, moderator, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '3rem' }}
              onFocus={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onBlur={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Sessions</option>
            <option value="active">Active Only</option>
            <option value="my">My Network</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Showing {filteredGDs.length} available session{filteredGDs.length !== 1 ? 's' : ''}
        </div>

        {filteredGDs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '8rem 2rem', 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '32px', 
            border: '1px dashed rgba(255, 255, 255, 0.1)' 
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>🔍</div>
            <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>No discussions found</h3>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {filteredGDs.map((gdItem) => (
              <div 
                key={gdItem._id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  padding: '2rem', 
                  borderRadius: '28px', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <span style={{ 
                      background: gdItem.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                      color: gdItem.isActive ? '#4ade80' : '#94a3b8', 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '100px', 
                      fontSize: '0.7rem', 
                      fontWeight: '800',
                      letterSpacing: '0.05em',
                      border: `1px solid ${gdItem.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'}`
                    }}>
                      {gdItem.isActive ? '● LIVE' : 'ENDED'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '700' }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"></path></svg>
                      {gdItem.participants.length}/{gdItem.maxParticipants}
                    </div>
                  </div>
                  
                  <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '800', margin: '0 0 0.75rem 0', lineHeight: 1.3 }}>
                    {gdItem.title}
                  </h3>
                  
                  <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0', fontSize: '0.95rem', lineHeight: 1.6, height: '4.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {gdItem.description || 'Join this session for an engaging collaborative discussion on the given topic.'}
                  </p>
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.8rem' }}>
                      {gdItem.moderator.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Moderated by</div>
                      <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>{gdItem.moderator.name}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {gdItem.isActive ? (
                      <>
                        <button
                          onClick={() => handleJoinGD(gdItem._id, gdItem.roomId)}
                          disabled={gdItem.participants.length >= gdItem.maxParticipants || joiningId === gdItem._id}
                          style={{
                            flex: 1,
                            padding: '0.85rem',
                            background: gdItem.participants.length >= gdItem.maxParticipants ? 'rgba(255, 255, 255, 0.05)' : joiningId === gdItem._id ? 'rgba(255, 255, 255, 0.1)' : 'white',
                            color: gdItem.participants.length >= gdItem.maxParticipants ? '#475569' : joiningId === gdItem._id ? '#94a3b8' : '#0f172a',
                            border: 'none',
                            borderRadius: '14px',
                            cursor: (gdItem.participants.length >= gdItem.maxParticipants || joiningId === gdItem._id) ? 'not-allowed' : 'pointer',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { if(gdItem.isActive && gdItem.participants.length < gdItem.maxParticipants) e.currentTarget.style.background = '#f1f5f9'; }}
                          onMouseLeave={e => { if(gdItem.isActive && gdItem.participants.length < gdItem.maxParticipants) e.currentTarget.style.background = 'white'; }}
                        >
                          {joiningId === gdItem._id ? 'Joining...' : gdItem.participants.length >= gdItem.maxParticipants ? 'Full' : 'Join Now'}
                        </button>
                        
                        <button
                          onClick={() => {
                            const shareLink = `${window.location.origin}/join/${gdItem.roomId}`;
                            navigator.clipboard.writeText(shareLink);
                            alert('Link copied to clipboard!');
                          }}
                          style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          title="Share Link"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        </button>
                      </>
                    ) : (
                      <div style={{ flex: 1, padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', color: '#475569', borderRadius: '14px', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                        SESSION CLOSED
                      </div>
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

export default BrowseGDs;