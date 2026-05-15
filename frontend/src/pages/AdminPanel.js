import React, { useState, useEffect } from 'react';
import { admin } from '../utils/api';
import './AdminPanel.css';

const AdminPanel = ({ user }) => {
  const [gds, setGds] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('gds');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [gdsRes, usersRes] = await Promise.all([
        admin.getAllGDs(),
        admin.getAllUsers()
      ]);
      setGds(gdsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleForceEnd = async (gdId) => {
    try {
      await admin.forceEndGD(gdId);
      fetchData();
    } catch (error) {
      console.error('Error ending GD:', error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await admin.deleteUser(userId);
        fetchData();
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const activeGDsCount = gds.filter(gd => gd.isActive).length;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-logo">
          <h1>VisionMeet Admin</h1>
          <span className="admin-logo-badge">Live Console</span>
        </div>
        <div className="admin-user-menu">
          <span className="admin-greeting">Admin: <strong>{user.name}</strong></span>
          <button onClick={logout} className="btn-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      <div className="admin-container">
        
        {/* Dashboard Metrics */}
        <div className="stats-grid">
          <div className="stat-card stat-users">
            <div className="stat-glow"></div>
            <div className="stat-icon primary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className="stat-details">
              <span className="stat-title">Total Users</span>
              <span className="stat-value">{users.length}</span>
            </div>
            <div className="stat-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>

          <div className="stat-card stat-sessions">
            <div className="stat-glow"></div>
            <div className="stat-icon success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.6 11.6L22 7L15.6 2.4"></path><path d="M2 17l6-4.6L2 7.8"></path><path d="M12 22v-5l6-4.6"></path><path d="M12 2v5l-6 4.6"></path></svg>
            </div>
            <div className="stat-details">
              <span className="stat-title">Active Sessions</span>
              <span className="stat-value">{activeGDsCount}</span>
            </div>
            <div className="stat-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>

          <div className="stat-card stat-gds">
            <div className="stat-glow"></div>
            <div className="stat-icon warning">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="stat-details">
              <span className="stat-title">Total GDs</span>
              <span className="stat-value">{gds.length}</span>
            </div>
            <div className="stat-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('gds')}
            className={`admin-tab ${activeTab === 'gds' ? 'active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Discussions
            <span className="tab-badge">{activeGDsCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            User Base
            <span className="tab-badge">{users.length}</span>
          </button>
        </div>

        {/* Tab Content: Group Discussions */}
        {activeTab === 'gds' && (
          <div className="table-container">
            <div className="table-header">
              <h2 className="table-title">Live Sessions</h2>
            </div>
            {gds.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                </div>
                <p>No active discussions monitored.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title & Identity</th>
                      <th>Host</th>
                      <th>Participants</th>
                      <th>Live Status</th>
                      <th>Timestamp</th>
                      <th>Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gds.map((gd) => (
                      <tr key={gd._id}>
                        <td>
                          <div className="cell-main">{gd.title}</div>
                          <div className="cell-sub">RID: {gd.roomId || gd._id.substring(0, 8)}</div>
                        </td>
                        <td>
                          <div className="cell-main">{gd.moderator?.name || 'Unknown'}</div>
                          <div className="cell-sub">{gd.moderator?.email}</div>
                        </td>
                        <td>
                          <div className="cell-main">{gd.participants?.length || 0} / {gd.maxParticipants}</div>
                          <div className="cell-sub">Members joined</div>
                        </td>
                        <td>
                          <span className={`status-badge ${gd.isActive ? 'active' : 'ended'}`}>
                            {gd.isActive ? 'Live Now' : 'Completed'}
                          </span>
                        </td>
                        <td>
                          <div className="cell-sub">
                            {new Date(gd.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="cell-sub">
                            {new Date(gd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          {gd.isActive && (
                            <button
                              onClick={() => handleForceEnd(gd._id)}
                              className="btn-action btn-force-end"
                            >
                              Terminate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="table-container">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="table-title">System Users</h2>
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  className="admin-search-input"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <p>{userSearchTerm ? `No users found matching "${userSearchTerm}"` : 'The user database is currently empty.'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Account Details</th>
                      <th>Permissions</th>
                      <th>Joined Date</th>
                      <th>Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="cell-main">{u.name}</div>
                          <div className="cell-sub">{u.email}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${u.email === 'admin@gd.com' ? 'active' : 'ended'}`}>
                            {u.email === 'admin@gd.com' ? 'Super Admin' : 'Standard User'}
                          </span>
                        </td>
                        <td>
                          <div className="cell-sub">
                             {new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          {u.email !== 'admin@gd.com' && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="btn-action btn-delete"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
