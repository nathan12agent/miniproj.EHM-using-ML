import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DiseaseDetection.css';

const DiseaseDetection = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [vitalSigns, setVitalSigns] = useState({
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchSymptoms();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/patients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchSymptoms = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_ML_URL || 'http://localhost:5001'}/symptoms/list`
      );
      if (response.data.success) {
        setAvailableSymptoms(response.data.symptoms);
      }
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    }
  };

  const handleSymptomToggle = (symptom) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleDetect = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    if (symptoms.length === 0) {
      alert('Please select at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/doctor/detect-disease`,
        {
          patientId: selectedPatient._id,
          symptoms,
          vitalSigns: {
            ...vitalSigns,
            age: calculateAge(selectedPatient.dateOfBirth),
            gender: selectedPatient.gender
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPrediction(response.data.detection);
      }
    } catch (error) {
      console.error('Error detecting disease:', error);
      alert('Failed to detect disease. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const handleGenerateReport = () => {
    navigate('/doctor/generate-report', {
      state: {
        patient: selectedPatient,
        detection: prediction,
        symptoms,
        vitalSigns
      }
    });
  };

  const filteredSymptoms = availableSymptoms.filter(symptom =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="disease-detection">
      <div className="detection-header">
        <h1>🔬 Disease Detection</h1>
        <button className="btn-back" onClick={() => navigate('/doctor/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="detection-content">
        <div className="patient-selection">
          <h2>Select Patient</h2>
          <select
            value={selectedPatient?._id || ''}
            onChange={(e) => {
              const patient = patients.find(p => p._id === e.target.value);
              setSelectedPatient(patient);
            }}
            className="patient-select"
          >
            <option value="">-- Select Patient --</option>
            {patients.map(patient => (
              <option key={patient._id} value={patient._id}>
                {patient.firstName} {patient.lastName} ({patient.patientId})
              </option>
            ))}
          </select>

          {selectedPatient && (
            <div className="patient-info">
              <h3>Patient Information</h3>
              <p><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</p>
              <p><strong>Age:</strong> {calculateAge(selectedPatient.dateOfBirth)} years</p>
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
              <p><strong>Blood Group:</strong> {selectedPatient.bloodGroup}</p>
            </div>
          )}
        </div>

        <div className="symptoms-section">
          <h2>Select Symptoms</h2>
          <input
            type="text"
            placeholder="Search symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="symptom-search"
          />
          <div className="symptoms-grid">
            {filteredSymptoms.slice(0, 50).map(symptom => (
              <div
                key={symptom}
                className={`symptom-chip ${symptoms.includes(symptom) ? 'selected' : ''}`}
                onClick={() => handleSymptomToggle(symptom)}
              >
                {symptom.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
          <div className="selected-symptoms">
            <strong>Selected ({symptoms.length}):</strong>
            {symptoms.map(symptom => (
              <span key={symptom} className="selected-symptom-tag">
                {symptom.replace(/_/g, ' ')}
                <button onClick={() => handleSymptomToggle(symptom)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="vitals-section">
          <h2>Vital Signs</h2>
          <div className="vitals-grid">
            <div className="vital-input">
              <label>Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                value={vitalSigns.temperature}
                onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                placeholder="98.6"
              />
            </div>
            <div className="vital-input">
              <label>BP Systolic</label>
              <input
                type="number"
                value={vitalSigns.bloodPressureSystolic}
                onChange={(e) => setVitalSigns({...vitalSigns, bloodPressureSystolic: e.target.value})}
                placeholder="120"
              />
            </div>
            <div className="vital-input">
              <label>BP Diastolic</label>
              <input
                type="number"
                value={vitalSigns.bloodPressureDiastolic}
                onChange={(e) => setVitalSigns({...vitalSigns, bloodPressureDiastolic: e.target.value})}
                placeholder="80"
              />
            </div>
            <div className="vital-input">
              <label>Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitalSigns.heartRate}
                onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                placeholder="70"
              />
            </div>
          </div>
        </div>

        <div className="action-section">
          <button
            className="btn-detect"
            onClick={handleDetect}
            disabled={loading || !selectedPatient || symptoms.length === 0}
          >
            {loading ? 'Detecting...' : '🔍 Detect Disease'}
          </button>
        </div>

        {prediction && (
          <div className="prediction-result">
            <h2>Detection Result</h2>
            <div className="result-card">
              <div className="predicted-disease">
                <h3>{prediction.predictedDisease}</h3>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
                <p className="confidence-text">
                  Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </p>
              </div>

              {prediction.allProbabilities && (
                <div className="all-predictions">
                  <h4>Top Predictions:</h4>
                  {Object.entries(prediction.allProbabilities)
                    .slice(0, 5)
                    .map(([disease, prob]) => (
                      <div key={disease} className="prediction-item">
                        <span>{disease}</span>
                        <span>{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="result-actions">
                <button className="btn-report" onClick={handleGenerateReport}>
                  📄 Generate Report
                </button>
                <button
                  className="btn-view-history"
                  onClick={() => navigate(`/doctor/patient/${selectedPatient._id}/reports`)}
                >
                  📋 View Previous Reports
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDetection;
