import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DoctorLayout from '../../components/DoctorLayout/DoctorLayout';
import './DoctorPatients.css';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/doctor/my-patients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatients(response.data);
      setFilteredPatients(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const patientId = patient.patientId?.toLowerCase() || '';
      const email = patient.email?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) || patientId.includes(search) || email.includes(search);
    });
    setFilteredPatients(filtered);
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
  };

  const handleDetectDisease = (patient) => {
    navigate('/doctor/ml-disease', { state: { selectedPatient: patient } });
  };

  const handleViewReports = (patient) => {
    navigate(`/doctor/patient/${patient._id}/reports`);
  };

  if (loading) {
    return (
      <DoctorLayout activeTab="patients">
        <div className="loading-state">Loading patients...</div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout activeTab="patients">
      <div className="patients-container">
        {/* Search and Stats */}
        <div className="patients-header">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="patients-count">
            <span className="count-number">{filteredPatients.length}</span>
            <span className="count-label">Patients</span>
          </div>
        </div>

        <div className="patients-content">
          {/* Patients List */}
          <div className="patients-list-panel">
            {filteredPatients.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <p>No patients found</p>
              </div>
            ) : (
              <div className="patients-grid">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    className={`patient-card ${selectedPatient?._id === patient._id ? 'selected' : ''}`}
                    onClick={() => handlePatientClick(patient)}
                  >
                    <div className="patient-avatar">
                      {patient.gender === 'Male' ? '👨' : patient.gender === 'Female' ? '👩' : '👤'}
                    </div>
                    <div className="patient-info">
                      <h3>{patient.firstName} {patient.lastName}</h3>
                      <p className="patient-id">ID: {patient.patientId}</p>
                      <div className="patient-meta">
                        <span className="meta-item">
                          <span className="meta-icon">🎂</span>
                          {calculateAge(patient.dateOfBirth)} years
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">🩸</span>
                          {patient.bloodGroup || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Details */}
          {selectedPatient && (
            <div className="patient-details-panel">
              <div className="details-header">
                <div className="details-avatar">
                  {selectedPatient.gender === 'Male' ? '👨' : selectedPatient.gender === 'Female' ? '👩' : '👤'}
                </div>
                <div>
                  <h2>{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                  <p className="details-id">{selectedPatient.patientId}</p>
                </div>
              </div>

              <div className="details-section">
                <h3>📋 Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Age</span>
                    <span className="info-value">{calculateAge(selectedPatient.dateOfBirth)} years</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{selectedPatient.gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Blood Group</span>
                    <span className="info-value">{selectedPatient.bloodGroup || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{selectedPatient.phone}</span>
                  </div>
                </div>
              </div>

              {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                <div className="details-section">
                  <h3>🏥 Medical History</h3>
                  <div className="history-list">
                    {selectedPatient.medicalHistory.map((history, index) => (
                      <div key={index} className="history-item">
                        <span className="history-condition">{history.condition}</span>
                        <span className="history-status">{history.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="details-section">
                  <h3>⚠️ Allergies</h3>
                  <div className="allergies-list">
                    {selectedPatient.allergies.map((allergy, index) => (
                      <span key={index} className="allergy-tag">
                        {allergy.allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="details-actions">
                <button
                  className="action-btn primary"
                  onClick={() => handleDetectDisease(selectedPatient)}
                >
                  <span>🔬</span>
                  Detect Disease
                </button>
                <button
                  className="action-btn secondary"
                  onClick={() => handleViewReports(selectedPatient)}
                >
                  <span>📄</span>
                  View Reports
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorPatients;
