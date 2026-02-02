import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DoctorLayout from '../../components/DoctorLayout/DoctorLayout';
import './MLDisease.css';

const MLDisease = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(location.state?.selectedPatient || null);
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    fetchPatients();
    fetchSymptoms();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/doctor/my-patients`,
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
      let uploadedFileUrls = [];
      
      // Upload files if any
      if (uploadedFiles.length > 0) {
        try {
          const uploadResult = await uploadFilesToServer(uploadedFiles);
          uploadedFileUrls = uploadResult.fileUrls || [];
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          alert('File upload failed, but continuing with disease detection...');
        }
      }

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
          },
          medicalFiles: uploadedFileUrls
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPrediction(response.data.detection);
        setUploadProgress({});
      }
    } catch (error) {
      console.error('Error detecting disease:', error);
      alert('Failed to detect disease. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFilesToServer = async (files) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`medicalFiles`, file);
    });
    formData.append('patientId', selectedPatient._id);
    formData.append('uploadType', 'medical_reports');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/doctor/upload-medical-files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, overall: percentCompleted }));
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  return (
    <DoctorLayout activeTab="ml-disease">
      <div className="ml-disease-container">
        <div className="ml-content-grid">
          {/* Left Panel - Patient & Symptoms */}
          <div className="left-panel">
            {/* Patient Selection */}
            <div className="panel-card">
              <h2>👤 Select Patient</h2>
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
                <div className="patient-info-box">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Age:</span>
                    <span className="info-value">{calculateAge(selectedPatient.dateOfBirth)} years</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gender:</span>
                    <span className="info-value">{selectedPatient.gender}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Blood Group:</span>
                    <span className="info-value">{selectedPatient.bloodGroup}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms Selection */}
            <div className="panel-card">
              <h2>🩺 Select Symptoms</h2>
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
              {symptoms.length > 0 && (
                <div className="selected-symptoms">
                  <strong>Selected ({symptoms.length}):</strong>
                  <div className="selected-tags">
                    {symptoms.map(symptom => (
                      <span key={symptom} className="selected-tag">
                        {symptom.replace(/_/g, ' ')}
                        <button onClick={() => handleSymptomToggle(symptom)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Medical Files Upload */}
            <div className="panel-card">
              <h2>📁 Medical Files</h2>
              <div className="file-upload-section">
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="medical-files"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.dcm,.dicom"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <label htmlFor="medical-files" className="file-upload-label">
                    <div className="upload-icon">📤</div>
                    <div className="upload-text">
                      <strong>Upload Medical Files</strong>
                      <p>CT Scans, X-rays, MRI, Lab Reports</p>
                      <small>Supports: JPG, PNG, PDF, DICOM</small>
                    </div>
                  </label>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    <h4>Uploaded Files ({uploadedFiles.length})</h4>
                    <div className="files-list">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <div className="file-info">
                            <span className="file-icon">
                              {getFileIcon(file.type)}
                            </span>
                            <div className="file-details">
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                          </div>
                          <button
                            className="remove-file-btn"
                            onClick={() => removeFile(index)}
                            title="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vital Signs */}
            <div className="panel-card">
              <h2>💓 Vital Signs</h2>
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

            {/* Detect Button */}
            <button
              className="btn-detect"
              onClick={handleDetect}
              disabled={loading || !selectedPatient || symptoms.length === 0}
            >
              {loading ? '🔄 Detecting...' : '🔍 Detect Disease'}
            </button>
          </div>

          {/* Right Panel - Results */}
          <div className="right-panel">
            {!prediction ? (
              <div className="empty-prediction">
                <span className="empty-icon">🔬</span>
                <h3>AI Disease Detection</h3>
                <p>Select a patient, choose symptoms, and click "Detect Disease" to get AI-powered predictions</p>
                <div className="features-list">
                  <div className="feature-item">✓ 41 Diseases</div>
                  <div className="feature-item">✓ 132 Symptoms</div>
                  <div className="feature-item">✓ 95% Accuracy</div>
                </div>
              </div>
            ) : (
              <div className="prediction-result">
                <h2>🎯 Detection Result</h2>
                
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

                  {prediction.medicalFiles && prediction.medicalFiles.length > 0 && (
                    <div className="attached-files">
                      <h4>📎 Attached Medical Files:</h4>
                      <div className="files-preview">
                        {prediction.medicalFiles.map((file, index) => (
                          <div key={index} className="file-preview-item">
                            <span className="file-icon">{getFileIcon(file.mimetype)}</span>
                            <div className="file-preview-info">
                              <span className="file-preview-name">{file.originalName}</span>
                              <span className="file-preview-size">{formatFileSize(file.size)}</span>
                            </div>
                            <a 
                              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${file.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-file-btn"
                            >
                              👁️ View
                            </a>
                          </div>
                        ))}
                      </div>
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
      </div>
    </DoctorLayout>
  );
};

export default MLDisease;
