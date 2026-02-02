import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './DoctorLayout.css';

const DoctorLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/doctor/login');
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/doctor/dashboard' },
    { id: 'disease-helper', label: 'Disease Helper', icon: '🩺', path: '/doctor/disease-helper' }
  ];

  return (
    <div className="doctor-layout">
      <div className="doctor-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <h2>DocClinic</h2>
          </div>
          <p className="subtitle">Doctor Portal</p>
        </div>

        <div className="doctor-profile">
          <div className="profile-avatar">👨‍⚕️</div>
          <div className="profile-info">
            <h3>{user?.name || 'Doctor'}</h3>
            <p>{user?.email}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="doctor-main">
        <div className="main-header">
          <div className="header-left">
            <h1>{tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}</h1>
          </div>
          <div className="header-right">
            <div className="header-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <button className="header-logout-btn" onClick={handleLogout} title="Logout">
              <span className="logout-icon">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="logout-modal-overlay">
            <div className="logout-modal">
              <div className="logout-modal-header">
                <h3>Confirm Logout</h3>
              </div>
              <div className="logout-modal-body">
                <p>Are you sure you want to logout from the Doctor Portal?</p>
              </div>
              <div className="logout-modal-actions">
                <button className="cancel-btn" onClick={cancelLogout}>
                  Cancel
                </button>
                <button className="confirm-btn" onClick={confirmLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorLayout;
