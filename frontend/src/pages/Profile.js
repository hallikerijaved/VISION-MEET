import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import api from '../utils/api';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('info'); // 'info' | 'password'
  const [form, setForm] = useState({ name: '', bio: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [picLoading, setPicLoading] = useState(false);

  useEffect(() => {
    api.get('/profile').then(res => {
      setProfile(res.data);
      setForm({ name: res.data.name, bio: res.data.bio || '' });
    }).catch(() => navigate('/dashboard'));
  }, [navigate]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/profile', form);
      setProfile(res.data.user);
      const updated = { ...user, name: res.data.user.name };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      showMsg('success', 'Profile updated successfully!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return showMsg('error', 'Image must be under 1MB');
    setPicLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await api.put('/profile/picture', { profilePicture: ev.target.result });
        setProfile(res.data.user);
        const updated = { ...user, profilePicture: res.data.user.profilePicture };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
        showMsg('success', 'Profile picture updated!');
      } catch (err) {
        showMsg('error', err.response?.data?.message || 'Upload failed');
      } finally {
        setPicLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return showMsg('error', 'New passwords do not match');
    if (pwForm.newPassword.length < 6)
      return showMsg('error', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.put('/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('success', 'Password changed successfully!');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem 1.25rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  };

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Navigation user={user} />

      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem 6rem', position: 'relative', zIndex: 1 }}>
        
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Account Settings
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>
            Manage your personal information and security preferences.
          </p>
        </div>

        {/* Profile Card */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(10px)', 
          borderRadius: '32px', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="avatar"
                style={{ width: '120px', height: '120px', borderRadius: '32px', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.05)' }} />
            ) : (
              <div style={{ width: '120px', height: '120px', borderRadius: '32px', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'white', fontWeight: '800' }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={() => fileRef.current.click()} disabled={picLoading}
              style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '40px', height: '40px', borderRadius: '12px', background: '#6366f1', border: '3px solid #0f172a', cursor: 'pointer', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
              {picLoading ? '⏳' : '📸'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePictureChange} />
          </div>
          
          {/* User Basic Info */}
          <div>
            <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>{profile.name}</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 0.75rem 0' }}>{profile.email}</p>
            <div style={{ display: 'inline-flex', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#64748b', fontSize: '0.8rem', fontWeight: '700' }}>
              MEMBER SINCE {new Date(profile.createdAt).getFullYear()}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {msg.text && (
          <div style={{ 
            background: msg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: msg.type === 'success' ? '#4ade80' : '#f87171', 
            padding: '1rem 1.5rem', 
            borderRadius: '16px', 
            marginBottom: '2rem', 
            border: `1px solid ${msg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: '0.95rem',
            fontWeight: '600',
            textAlign: 'center',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {msg.type === 'success' ? '✅' : '❌'} {msg.text}
          </div>
        )}

        {/* Settings Tabs */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(10px)', 
          borderRadius: '32px', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {[['info', '👤 Profile Info'], ['password', '🔐 Security']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                flex: 1, padding: '1.5rem', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700',
                background: tab === key ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                color: tab === key ? '#818cf8' : '#64748b',
                borderBottom: tab === key ? '3px solid #6366f1' : '3px solid transparent',
                transition: 'all 0.3s'
              }}>{label}</button>
            ))}
          </div>

          <div style={{ padding: '3rem' }}>
            {tab === 'info' && (
              <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '2rem' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name" required className="stitch-input" />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={profile.email} disabled />
                  <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '600' }}>Email cannot be modified for security reasons.</p>
                </div>
                <div>
                  <label style={labelStyle}>Bio / Professional Summary</label>
                  <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us about your background and goals..." className="stitch-input" />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: '1.25rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '16px',
                  fontSize: '1.1rem', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
                  boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.3)'
                }} onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                   onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}>
                  {loading ? 'SAVING CHANGES...' : 'SAVE PROFILE'}
                </button>
              </form>
            )}

            {tab === 'password' && (
              <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '2rem' }}>
                {[
                  ['currentPassword', 'Current Password', 'Verify your identity'],
                  ['newPassword', 'New Password', 'Minimum 6 characters'],
                  ['confirmPassword', 'Confirm New Password', 'Repeat new password']
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input type="password" style={inputStyle} value={pwForm[key]}
                      onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                      placeholder={placeholder} required className="stitch-input" />
                  </div>
                ))}
                <button type="submit" disabled={loading} style={{
                  padding: '1.25rem', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px',
                  fontSize: '1.1rem', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s'
                }} onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                   onMouseLeave={e => !loading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}>
                  {loading ? 'UPDATING SECURITY...' : 'CHANGE PASSWORD'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .stitch-input:focus { border-color: #6366f1 !important; background: rgba(255, 255, 255, 0.08) !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Profile;
