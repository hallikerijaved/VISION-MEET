import React, { useState, useEffect } from 'react';
import { admin } from '../utils/api';
import './AdminPanel.css';

const AdminPanel = ({ user }) => {
  const [gds, setGds] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('gds');

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

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-logo">
          <h1>Admin Control</h1>
          <span className="admin-logo-badge">Live System</span>
        </div>
        <div className="admin-user-menu">
          <span className="admin-greeting">Welcome, <strong>{user.name}</strong></span>
          <button onClick={logout} className="btn-logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        
        {/* Dashboard Metrics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">👥</div>
            <div className="stat-details">
              <span className="stat-title">Total Users</span>
              <span className="stat-value">{users.length}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">🟢</div>
            <div className="stat-details">
              <span className="stat-title">Active Sessions</span>
              <span className="stat-value">{activeGDsCount}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">📊</div>
            <div className="stat-details">
              <span className="stat-title">Total Discussions</span>
              <span className="stat-value">{gds.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('gds')}
            className={`admin-tab ${activeTab === 'gds' ? 'active' : ''}`}
          >
            Group Discussions
            <span className="tab-badge">{activeGDsCount} Active</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          >
            User Management
            <span className="tab-badge">{users.length}</span>
          </button>
        </div>

        {/* Tab Content: Group Discussions */}
        {activeTab === 'gds' && (
          <div className="table-container">
            <div className="table-header">
              <h2 className="table-title">Discussion Rooms</h2>
            </div>
            {gds.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>No group discussions found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title & ID</th>
                      <th>Moderator</th>
                      <th>Participants</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gds.map((gd) => (
                      <tr key={gd._id}>
                        <td>
                          <div className="cell-main">{gd.title}</div>
                          <div className="cell-sub">ID: {gd.roomId || gd._id.substring(0, 8)}...</div>
                        </td>
                        <td>{gd.moderator?.name || 'N/A'}</td>
                        <td>
                          <strong>{gd.participants?.length || 0}</strong> / {gd.maxParticipants}
                        </td>
                        <td>
                          <span className={`status-badge ${gd.isActive ? 'active' : 'ended'}`}>
                            {gd.isActive ? 'Live' : 'Ended'}
                          </span>
                        </td>
                        <td className="cell-sub">
                          {new Date(gd.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td>
                          {gd.isActive && (
                            <button
                              onClick={() => handleForceEnd(gd._id)}
                              className="btn-action btn-force-end"
                            >
                              Force End
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
            <div className="table-header">
              <h2 className="table-title">Registered Users</h2>
            </div>
            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <p>No users registered yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Details</th>
                      <th>Role</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="cell-main">{u.name}</div>
                          <div className="cell-sub">{u.email}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${u.email === 'admin@gd.com' ? 'active' : 'ended'}`}>
                            {u.email === 'admin@gd.com' ? 'Administrator' : 'User'}
                          </span>
                        </td>
                        <td className="cell-sub">
                          {new Date(u.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td>
                          {u.email !== 'admin@gd.com' && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              className="btn-action btn-delete"
                            >
                              Delete
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