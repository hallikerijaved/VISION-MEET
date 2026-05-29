import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gd } from '../utils/api';
import Navigation from '../components/Navigation';

const CreateGD = ({ user }) => {
  const [form, setForm] = useState({ title: '', description: '', maxParticipants: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await gd.create(form);
      navigate(`/room/${response.data.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create discussion');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '1.2rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.75rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Cinematic Background Elements */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none', animation: 'float 20s infinite alternate' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none', animation: 'float 25s infinite alternate-reverse' }} />
      <style>{`
        @keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, -30px); } }
        .stitch-input:focus { border-color: #6366f1 !important; background: rgba(255, 255, 255, 0.08) !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
      `}</style>

      <Navigation user={user} />

      <div style={{ 
        maxWidth: '700px', 
        margin: '4rem auto', 
        padding: '0 2rem 6rem', 
        position: 'relative', 
        zIndex: 1 
      }}>
        
        {/* Breadcrumb / Category */}
        <div style={{ display: 'inline-flex', padding: '0.6rem 1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '100px', color: '#818cf8', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          🚀 LAUNCH CENTER
        </div>

        <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: '900', margin: '0 0 1rem 0', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Create <span style={{ background: 'linear-gradient(to right, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discussion</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
          Set the stage for a collaborative exchange. Define your topic and invite participants to share their insights.
        </p>

        {/* Glass Form Container */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(20px)', 
          borderRadius: '32px', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem' }}>
            <div>
              <label style={labelStyle}>Discussion Topic</label>
              <input
                type="text"
                placeholder="e.g., The Impact of AI on Future Jobs"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="stitch-input"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description & Goals</label>
              <textarea
                placeholder="Briefly describe the context and what you hope to achieve..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="stitch-input"
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={labelStyle}>Max Participants</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) })}
                    required
                    className="stitch-input"
                    style={inputStyle}
                  />
                  <span style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '0.8rem', fontWeight: '700' }}>USERS</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem 0', fontStyle: 'italic' }}>
                  Optimal for 6-8 peers
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  background: loading ? '#1e293b' : 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '18px',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                    LAUNCHING SESSION...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Start Discussion
                  </>
                )}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
          {[
            { icon: '✨', title: 'AI Moderation', text: 'Real-time sentiment and contribution analysis powered by Stitch AI.' },
            { icon: '🛡️', title: 'Secure Room', text: 'Encrypted peer-to-peer communication with instant join links.' }
          ].map((item, idx) => (
            <div key={idx} style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
              <div>
                <h4 style={{ color: 'white', margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '800' }}>{item.title}</h4>
                <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateGD;