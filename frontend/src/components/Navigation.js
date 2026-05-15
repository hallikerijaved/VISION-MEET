import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ item, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '0.5rem 0.85rem',
    background: active ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
    color: active ? '#a78bfa' : 'rgba(255, 255, 255, 0.7)',
    border: active ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid transparent',
    borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? '600' : '500',
    whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem',
    width: '100%', justifyContent: 'flex-start'
  }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'white'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; }}}
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
      style={{ position: 'relative', width: '100%' }} 
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button style={{
        padding: '0.5rem 0.85rem',
        background: isActive ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
        color: isActive ? '#a78bfa' : 'rgba(255, 255, 255, 0.7)',
        border: isActive ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid transparent',
        borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: isActive ? '600' : '500',
        whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem',
        width: '100%', justifyContent: 'space-between'
      }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'white'; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; }}}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{display:'flex', alignItems:'center', gap:'0.4rem'}}>
          <span>{icon}</span> {title}
        </div>
        <span style={{ fontSize: '0.7rem', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: '0.5rem', zIndex: 1001, width: '100%' }}>
          <div style={{
            background: '#1e1b4b', borderRadius: '12px', padding: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', minWidth: '180px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column', gap: '0.2rem'
          }}>
            {items.map(item => (
              <div 
                key={item.path} 
                onClick={() => navigate(item.path)}
                style={{
                  padding: '0.6rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                  color: activePath === item.path ? '#a78bfa' : 'rgba(255,255,255,0.8)',
                  background: activePath === item.path ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                  fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s', fontWeight: activePath === item.path ? '600' : '500'
                }}
                onMouseEnter={e => { if (activePath !== item.path) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={e => { if (activePath !== item.path) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
              >
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Navigation = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        { path: '/evaluations', label: 'Evaluations', icon: '📈' }
      ]
    }
  ];

  return (
    <nav className="stitch-dashboard-nav" style={{
      background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.95) 100%)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'sticky', top: 0, zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <div className="stitch-nav-inner" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', minHeight: '64px', flexWrap: 'wrap', gap: '1rem', padding: '0.5rem 0' }}>
        
        {/* Top Row for Mobile (Logo + Toggle) */}
        <div className="stitch-logo-container">
          {/* Logo */}
          <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', textDecoration: 'none' }}>
            <span style={{ color: 'white', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.04em', fontFamily: "'Manrope', sans-serif" }}>Vision<span style={{ color: '#a78bfa' }}>Meet</span></span>
          </div>
          
          <button 
            className="stitch-mobile-toggle" 
            style={{ color: 'white' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Nav Items & User Actions */}
        <div className={`stitch-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          
          {/* Menu Items */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: 'inherit', width: '100%' }}>
            {navStructure.map((menu, idx) => {
              if (menu.type === 'link') {
                return <div key={idx} style={{width: '100%', maxWidth: 'max-content'}}><NavItem item={menu} active={location.pathname === menu.path} onClick={() => { navigate(menu.path); setIsMobileMenuOpen(false); }} /></div>;
              } else if (menu.type === 'dropdown') {
                return <div key={idx} style={{width: '100%', maxWidth: 'max-content'}}><NavDropdown title={menu.title} icon={menu.icon} items={menu.items} activePath={location.pathname} /></div>;
              }
              return null;
            })}
          </div>

          {/* User + Logout */}
          <div className="stitch-nav-user-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: isMobileMenuOpen ? '0.5rem' : '0' }}>
            <div onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '8px', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #818cf8, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span style={{ color: 'white', fontSize: '0.95rem', fontWeight: '600' }}>{user?.name}</span>
            </div>
            <button onClick={logout} style={{
              padding: '0.5rem 1.2rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;