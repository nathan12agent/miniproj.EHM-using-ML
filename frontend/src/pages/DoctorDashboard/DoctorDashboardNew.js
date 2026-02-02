import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DoctorLayout from '../../components/DoctorLayout/DoctorLayout';
import './DoctorDashboardNew.css';

const DoctorDashboardNew = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedToday: 0,
    totalPatients: 0,
    recentDetections: []
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [statsRes, appointmentsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/doctor/dashboard/stats`, config),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/doctor/appointments?date=${selectedDate}`, config)
      ]);

      setStats(statsRes.data);
      setAppointments(appointmentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        navigate('/doctor/login');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Scheduled': '#f59e0b',
      'Confirmed': '#10b981',
      'In Progress': '#3b82f6',
      'Completed': '#6b7280',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <DoctorLayout activeTab="dashboard">
        <div className="loading-state">Loading dashboard...</div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout activeTab="dashboard">
      <div className="dashboard-container">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{stats.todayAppointments}</h3>
              <p>Today's Appointments</p>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.completedToday}</h3>
              <p>Completed Today</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.totalPatients}</h3>
              <p>Total Patients</p>
            </div>
          </div>

          <div className="stat-card orange clickable" onClick={() => navigate('/doctor/ml-disease')}>
            <div className="stat-icon">🔬</div>
            <div className="stat-content">
              <h3>ML Detection</h3>
              <p>Detect Diseases</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Appointments Section */}
          <div className="appointments-panel">
            <div className="panel-header">
              <h2>📋 Appointments</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>

            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No appointments for this date</p>
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="appointment-card">
                    <div className="appointment-time">
                      <span className="time">{appointment.appointmentTime}</span>
                      <span className="duration">{appointment.duration}min</span>
                    </div>
                    <div className="appointment-details">
                      <h4>{appointment.patient?.firstName} {appointment.patient?.lastName}</h4>
                      <p className="patient-id">ID: {appointment.patient?.patientId}</p>
                      <p className="appointment-type">{appointment.type}</p>
                    </div>
                    <div className="appointment-status">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(appointment.status) }}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Detections Section */}
          <div className="detections-panel">
            <div className="panel-header">
              <h2>🔬 Recent ML Detections</h2>
            </div>

            <div className="detections-list">
              {stats.recentDetections.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <p>No recent detections</p>
                  <button 
                    className="btn-primary-small"
                    onClick={() => navigate('/doctor/ml-disease')}
                  >
                    Start Detection
                  </button>
                </div>
              ) : (
                stats.recentDetections.map((detection) => (
                  <div key={detection._id} className="detection-card">
                    <div className="detection-header">
                      <span className="patient-name">
                        {detection.patient?.firstName} {detection.patient?.lastName}
                      </span>
                      <span className="detection-date">
                        {new Date(detection.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detection-result">
                      <div className="disease-name">{detection.predictedDisease}</div>
                      <div className="confidence-badge">
                        {(detection.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => navigate('/doctor/patients')}>
              <span className="action-icon">👥</span>
              <span className="action-label">View Patients</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/doctor/ml-disease')}>
              <span className="action-icon">🔬</span>
              <span className="action-label">ML Detection</span>
            </button>
            <button className="action-btn" onClick={() => navigate('/doctor/generate-report')}>
              <span className="action-icon">📄</span>
              <span className="action-label">Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboardNew;
