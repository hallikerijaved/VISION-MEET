import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ item, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '0.6rem 1rem',
    background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    color: active ? '#818cf8' : 'rgba(255, 255, 255, 0.7)',
    border: active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontSize: '0.9rem', 
    fontWeight: active ? '700' : '600',
    whiteSpace: 'nowrap', 
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem',
    width: '100%', 
    justifyContent: 'flex-start',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; e.currentTarget.style.transform = 'translateY(0)'; }}}
  >
    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span> {item.label}
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
        padding: '0.6rem 1rem',
        background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        color: isActive ? '#818cf8' : 'rgba(255, 255, 255, 0.7)',
        border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
        borderRadius: '12px', 
        cursor: 'pointer', 
        fontSize: '0.9rem', 
        fontWeight: isActive ? '700' : '600',
        whiteSpace: 'nowrap', 
        transition: 'all 0.2s', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        width: '100%', 
        justifyContent: 'space-between',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'white'; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'; }}}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span> {title}
        </div>
        <span style={{ fontSize: '0.7rem', opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: '0.75rem', zIndex: 1001, width: 'max-content', minWidth: '100%' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(16px)',
            borderRadius: '20px', 
            padding: '0.75rem',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.4rem',
            animation: 'dropdownFade 0.2s ease-out'
          }}>
            <style>{`@keyframes dropdownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {items.map(item => (
              <div 
                key={item.path} 
                onClick={() => { navigate(item.path); setIsOpen(false); }}
                style={{
                  padding: '0.75rem 1rem', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  color: activePath === item.path ? '#818cf8' : 'rgba(255,255,255,0.8)',
                  background: activePath === item.path ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  fontSize: '0.85rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  transition: 'all 0.2s', 
                  fontWeight: activePath === item.path ? '700' : '600'
                }}
                onMouseEnter={e => { if (activePath !== item.path) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; } }}
                onMouseLeave={e => { if (activePath !== item.path) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span> {item.label}
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
        { path: '/browse-gds', label: 'Browse Sessions', icon: '🔍' },
        { path: '/my-gds', label: 'My Sessions', icon: '📋' }
      ]
    },
    { 
      type: 'dropdown', title: 'AI Workspace', icon: '🤖', 
      items: [
        { path: '/interview', label: 'AI Interview', icon: '🎤' },
        { path: '/resume-builder', label: 'Resume AI', icon: '📄' }
      ]
    },
    { 
      type: 'dropdown', title: 'Analytics', icon: '📊', 
      items: [
        { path: '/evaluations', label: 'Performance', icon: '📈' }
      ]
    }
  ];

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'sticky', 
      top: 0, 
      zIndex: 1000,
      padding: '0.5rem 0'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}>
        
        {/* Brand */}
        <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <div style={{ 
            width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', 
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            🎓
          </div>
          <span style={{ color: 'white', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.04em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Vision<span style={{ color: '#818cf8' }}>Meet</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="nav-desktop-only">
          {navStructure.map((menu, idx) => (
            <div key={idx} style={{ minWidth: 'max-content' }}>
              {menu.type === 'link' ? (
                <NavItem item={menu} active={location.pathname === menu.path} onClick={() => navigate(menu.path)} />
              ) : (
                <NavDropdown title={menu.title} icon={menu.icon} items={menu.items} activePath={location.pathname} />
              )}
            </div>
          ))}
        </div>

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div onClick={() => navigate('/profile')} style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', 
            padding: '0.4rem 0.75rem', borderRadius: '14px', transition: 'all 0.2s',
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid #6366f1' }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.9rem' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap' }} className="nav-name-only">{user?.name}</span>
          </div>

          <button onClick={logout} style={{
            padding: '0.6rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', cursor: 'pointer', 
            fontSize: '0.85rem', fontWeight: '800', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#f87171'; }}
          >
            Sign Out
          </button>
        </div>

      </div>
      <style>{`
        @media (max-width: 1024px) {
          .nav-desktop-only, .nav-name-only { display: none; }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;