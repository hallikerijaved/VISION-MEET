import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ item, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '0.45rem 0.85rem',
    background: active ? 'rgba(167,139,250,0.2)' : 'transparent',
    color: active ? '#a78bfa' : 'rgba(255,255,255,0.7)',
    border: active ? '1px solid rgba(167,139,250,0.4)' : '1px solid transparent',
    borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? '600' : '400',
    whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
  }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}}
  >
    <span>{item.icon}</span> {item.label}
  </button>
);

const NavDropdown = ({ title, icon, items, activePath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isActive = items.some(item => item.path === activePath);

  return (
    <div 
      style={{ position: 'relative' }} 
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button style={{
        padding: '0.45rem 0.85rem',
        background: isActive ? 'rgba(167,139,250,0.2)' : 'transparent',
        color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.7)',
        border: isActive ? '1px solid rgba(167,139,250,0.4)' : '1px solid transparent',
        borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: isActive ? '600' : '400',
        whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
      }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}}
      >
        <span>{icon}</span> {title}
        <span style={{ fontSize: '0.7rem', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem',
          background: '#1e1b4b', borderRadius: '12px', padding: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', minWidth: '180px',
          border: '1px solid rgba(255,255,255,0.1)', zIndex: 1001,
          display: 'flex', flexDirection: 'column', gap: '0.2rem'
        }}>
          {items.map(item => (
            <div 
              key={item.path} 
              onClick={() => navigate(item.path)}
              style={{
                padding: '0.6rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                color: activePath === item.path ? '#a78bfa' : 'rgba(255,255,255,0.8)',
                background: activePath === item.path ? 'rgba(167,139,250,0.15)' : 'transparent',
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (activePath !== item.path) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
              onMouseLeave={e => { if (activePath !== item.path) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Navigation = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const navStructure = [
    { type: 'link', path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { 
      type: 'dropdown', title: 'Discussions', icon: '💬', 
      items: [
        { path: '/create-gd', label: 'Start New GD', icon: '🚀' },
        { path: '/browse-gds', label: 'Browse GDs', icon: '🔍' },
        { path: '/my-gds', label: 'My GDs', icon: '📋' }
      ]
    },
    { 
      type: 'dropdown', title: 'AI Tools', icon: '🤖', 
      items: [
        { path: '/interview', label: 'AI Interview', icon: '🎤' },
        { path: '/resume-builder', label: 'Resume Builder', icon: '📄' }
      ]
    },
    { 
      type: 'dropdown', title: 'Performance', icon: '📊', 
      items: [
        { path: '/evaluations', label: 'Evaluations', icon: '📈' },
        { path: '/certificates', label: 'Certificates', icon: '🏆' }
      ]
    }
  ];

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      padding: '0 2rem',
      position: 'sticky', top: 0, zIndex: 1000,
      boxShadow: '0 4px 20px rgba(79,70,229,0.3)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
        
        {/* Logo */}
        <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', textDecoration: 'none' }}>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Vision<span style={{ color: '#a78bfa' }}>Meet</span></span>
        </div>

        {/* Nav Items */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {navStructure.map((menu, idx) => {
            if (menu.type === 'link') {
              return <NavItem key={idx} item={menu} active={location.pathname === menu.path} onClick={() => navigate(menu.path)} />;
            } else if (menu.type === 'dropdown') {
              return <NavDropdown key={idx} title={menu.title} icon={menu.icon} items={menu.items} activePath={location.pathname} />;
            }
            return null;
          })}
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #818cf8, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: '500', display: 'none' }} className="nav-username">{user.name}</span>
            <style>{`@media (min-width: 768px) { .nav-username { display: inline !important; } }`}</style>
          </div>
          <button onClick={logout} style={{
            padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;