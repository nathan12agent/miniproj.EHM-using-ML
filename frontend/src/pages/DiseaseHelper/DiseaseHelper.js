import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Psychology as MLIcon,
  Person as PatientIcon,
  Assessment as DiagnosisIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Medication as MedicationIcon,
  Description as ReportIcon,
  CheckCircle as CheckIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  Visibility as PreviewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { mlApi } from '../../services/mlApi';

function DiseaseHelper() {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  
  // Symptom-based detection state
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    medicalHistory: '',
    patientId: '',
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [similarPatients, setSimilarPatients] = useState([]);
  const [remedies, setRemedies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectionComplete, setDetectionComplete] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [patientSaved, setPatientSaved] = useState(false);

  // Skin disease detection state
  const [skinPatientInfo, setSkinPatientInfo] = useState({
    name: '',
    age: '',
    gender: '',
    medicalHistory: '',
    patientId: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [skinPrediction, setSkinPrediction] = useState(null);
  const [skinLoading, setSkinLoading] = useState(false);
  const [skinDetectionComplete, setSkinDetectionComplete] = useState(false);
  const [skinConditions, setSkinConditions] = useState([]);

  useEffect(() => {
    loadSymptoms();
    loadSkinConditions();
  }, []);

  const loadSymptoms = async () => {
    try {
      const response = await mlApi.getSymptomsWithFallback();
      setAvailableSymptoms(response.symptoms);
    } catch (error) {
      console.error('Error loading symptoms:', error);
      // Fallback symptoms
      const defaultSymptoms = [
        'fever', 'cough', 'headache', 'fatigue', 'nausea', 'vomiting',
        'diarrhea', 'abdominal_pain', 'chest_pain', 'shortness_of_breath',
        'dizziness', 'muscle_pain', 'joint_pain', 'sore_throat', 'runny_nose',
        'loss_of_appetite', 'weight_loss', 'night_sweats', 'skin_rash',
        'blurred_vision', 'confusion', 'seizures', 'numbness', 'weakness'
      ];
      setAvailableSymptoms(defaultSymptoms.map(symptom => ({
        id: symptom,
        name: symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: symptom
      })));
    }
  };

  const loadSkinConditions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_ML_API_URL || 'http://localhost:5001'}/skin/conditions`);
      if (response.ok) {
        const data = await response.json();
        setSkinConditions(data.conditions || []);
      }
    } catch (error) {
      console.error('Error loading skin conditions:', error);
    }
  };

  const handleSymptomsChange = (event, newValue) => {
    setSelectedSymptoms(newValue);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const detectSkinDisease = async () => {
    if (!skinPatientInfo.name || !selectedImage) {
      alert('Please fill in patient information and upload an image.');
      return;
    }

    setSkinLoading(true);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;
        
        try {
          const response = await fetch(`${process.env.REACT_APP_ML_API_URL || 'http://localhost:5001'}/skin/predict`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image,
              patient_info: skinPatientInfo
            })
          });

          if (response.ok) {
            const result = await response.json();
            setSkinPrediction(result.prediction);
            setSkinDetectionComplete(true);
          } else {
            throw new Error('Failed to get skin disease prediction');
          }
        } catch (error) {
          console.error('Error detecting skin disease:', error);
          alert('Error detecting skin disease. Please try again.');
        } finally {
          setSkinLoading(false);
        }
      };
      
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
      setSkinLoading(false);
    }
  };

  const detectDisease = async () => {
    if (!patientInfo.name || selectedSymptoms.length === 0) {
      alert('Please fill in patient information and select symptoms.');
      return;
    }

    setLoading(true);
    
    try {
      // Create symptoms object for ML API
      const symptoms = {};
      availableSymptoms.forEach(symptom => {
        symptoms[symptom.value] = selectedSymptoms.some(selected => selected.value === symptom.value) ? 1 : 0;
      });

      // Get ML prediction
      const result = await mlApi.predictWithFallback(symptoms, patientInfo);
      setPrediction(result.prediction);

      // Generate similar patients (mock data for demo)
      const mockSimilarPatients = generateSimilarPatients(selectedSymptoms, result.prediction);
      setSimilarPatients(mockSimilarPatients);

      // Generate remedies based on prediction and severity
      const generatedRemedies = generateRemedies(result.prediction);
      setRemedies(generatedRemedies);

      // Save patient to records automatically after detection
      await savePatientRecord(result.prediction, mockSimilarPatients, generatedRemedies);

      setDetectionComplete(true);
    } catch (error) {
      console.error('Error detecting disease:', error);
      alert('Error detecting disease. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePatientRecord = async (prediction, similarPatients, remedies) => {
    try {
      const token = localStorage.getItem('token');
      const patientRecord = {
        patientId: patientInfo.patientId || `P${Date.now()}`,
        name: patientInfo.name,
        age: parseInt(patientInfo.age),
        gender: patientInfo.gender,
        medicalHistory: patientInfo.medicalHistory,
        symptoms: selectedSymptoms.map(s => s.name),
        diagnosis: {
          predictedCondition: prediction.predicted_condition,
          confidence: prediction.confidence,
          alternativeDiagnoses: prediction.top_predictions?.slice(1, 4) || []
        },
        similarPatients: similarPatients.map(p => ({
          patientId: p.id,
          similarity: p.similarity,
          outcome: p.treatmentOutcome
        })),
        treatmentPlan: {
          immediate: remedies.immediate || [],
          medications: remedies.medications || [],
          lifestyle: remedies.lifestyle || [],
          severity: getSeverityLevel(prediction.confidence)
        },
        notes: `Disease detection completed with ${(prediction.confidence * 100).toFixed(1)}% confidence. Patient automatically added to records.`
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/patient-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientRecord)
      });

      if (response.ok) {
        const savedRecord = await response.json();
        console.log('Patient record saved successfully:', savedRecord);
        setPatientSaved(true);
        
        // Update dashboard with new record
        const dashboardEvent = new CustomEvent('patientRecordAdded', { 
          detail: savedRecord 
        });
        window.dispatchEvent(dashboardEvent);
      } else {
        console.error('Failed to save patient record:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving patient record:', error);
    }
  };

  const generateSimilarPatients = (symptoms, prediction) => {
    const mockPatients = [
      {
        id: 'P001',
        name: 'John Smith',
        age: 45,
        gender: 'Male',
        diagnosis: prediction.predicted_condition,
        symptoms: symptoms.slice(0, Math.min(3, symptoms.length)),
        treatmentOutcome: 'Recovered',
        treatmentDuration: '14 days',
        severity: 'Moderate',
        similarity: 0.92,
        notes: 'Responded well to standard treatment protocol'
      },
      {
        id: 'P002',
        name: 'Mary Johnson',
        age: 38,
        gender: 'Female',
        diagnosis: prediction.predicted_condition,
        symptoms: symptoms.slice(1, Math.min(4, symptoms.length)),
        treatmentOutcome: 'Recovered',
        treatmentDuration: '10 days',
        severity: 'Mild',
        similarity: 0.87,
        notes: 'Early intervention led to quick recovery'
      },
      {
        id: 'P003',
        name: 'Robert Davis',
        age: 52,
        gender: 'Male',
        diagnosis: prediction.predicted_condition,
        symptoms: symptoms.slice(0, Math.min(4, symptoms.length)),
        treatmentOutcome: 'Improved',
        treatmentDuration: '21 days',
        severity: 'Severe',
        similarity: 0.84,
        notes: 'Required extended treatment due to complications'
      }
    ];

    return mockPatients;
  };

  const generateRemedies = (prediction) => {
    const severityLevel = prediction.confidence > 0.8 ? 'High' : prediction.confidence > 0.6 ? 'Medium' : 'Low';
    
    const remedyDatabase = {
      'High': {
        immediate: [
          'Immediate medical attention required',
          'Hospital admission may be necessary',
          'Continuous monitoring recommended',
          'IV fluids and medications as prescribed'
        ],
        medications: [
          'Prescription antibiotics (if bacterial)',
          'Anti-inflammatory medications',
          'Pain management as needed',
          'Specialized medications based on condition'
        ],
        lifestyle: [
          'Complete bed rest',
          'Strict dietary restrictions',
          'Regular vital signs monitoring',
          'Follow-up appointments every 2-3 days'
        ]
      },
      'Medium': {
        immediate: [
          'Medical consultation within 24 hours',
          'Monitor symptoms closely',
          'Rest and hydration',
          'Over-the-counter medications as appropriate'
        ],
        medications: [
          'Symptomatic relief medications',
          'Vitamins and supplements',
          'Probiotics if applicable',
          'Topical treatments if needed'
        ],
        lifestyle: [
          'Modified activity level',
          'Balanced diet with specific nutrients',
          'Adequate sleep (8+ hours)',
          'Weekly follow-up appointments'
        ]
      },
      'Low': {
        immediate: [
          'Home care with monitoring',
          'Rest and plenty of fluids',
          'Symptom tracking',
          'Seek medical care if symptoms worsen'
        ],
        medications: [
          'Over-the-counter pain relievers',
          'Natural remedies and supplements',
          'Herbal teas and home remedies',
          'Preventive medications if applicable'
        ],
        lifestyle: [
          'Light exercise as tolerated',
          'Healthy, balanced diet',
          'Stress management techniques',
          'Monthly check-ups'
        ]
      }
    };

    return remedyDatabase[severityLevel] || remedyDatabase['Medium'];
  };

  const getSeverityColor = (confidence) => {
    if (confidence >= 0.8) return '#dc2626'; // Red for high
    if (confidence >= 0.6) return '#f59e0b'; // Orange for medium
    return '#059669'; // Green for low
  };

  const getSeverityLevel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const generateReport = () => {
    setShowReportDialog(true);
  };

  const confirmGenerateReport = () => {
    setReportGenerated(true);
    setShowReportDialog(false);
  };

  const printReport = () => {
    window.print();
  };

  const downloadReport = () => {
    const reportContent = `
DISEASE DETECTION REPORT
Generated on: ${new Date().toLocaleDateString()}
Doctor: ${user?.name}

PATIENT INFORMATION:
Name: ${patientInfo.name}
Age: ${patientInfo.age}
Gender: ${patientInfo.gender}
Patient ID: ${patientInfo.patientId}
Medical History: ${patientInfo.medicalHistory}

SYMPTOMS:
${selectedSymptoms.map(s => s.name).join(', ')}

AI DIAGNOSIS:
Condition: ${prediction?.predicted_condition}
Confidence: ${(prediction?.confidence * 100).toFixed(1)}%
Severity: ${getSeverityLevel(prediction?.confidence)}

SIMILAR CASES:
${similarPatients.map(p => `- ${p.name} (${p.age}${p.gender[0]}) - ${p.treatmentOutcome} in ${p.treatmentDuration}`).join('\n')}

RECOMMENDED TREATMENT:
${remedies.immediate?.join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disease-detection-report-${patientInfo.name}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetDetection = () => {
    setPatientInfo({
      name: '',
      age: '',
      gender: '',
      medicalHistory: '',
      patientId: '',
    });
    setSelectedSymptoms([]);
    setPrediction(null);
    setSimilarPatients([]);
    setRemedies([]);
    setDetectionComplete(false);
    setReportGenerated(false);
    setPatientSaved(false);
  };

  const resetSkinDetection = () => {
    setSkinPatientInfo({
      name: '',
      age: '',
      gender: '',
      medicalHistory: '',
      patientId: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setSkinPrediction(null);
    setSkinDetectionComplete(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#0891b2' }}>
        🩺 Disease Helper
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AI-powered disease detection and treatment recommendations
      </Typography>

      {/* Tabs for different detection methods */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="disease detection tabs">
          <Tab label="Symptom-Based Detection" />
          <Tab label="Skin Disease Detection" />
        </Tabs>
      </Box>

      {/* Symptom-Based Detection Tab */}
      {activeTab === 0 && (
        <Box>
          {!detectionComplete ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Patient Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Patient Name"
                        value={patientInfo.name}
                        onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Patient ID (Optional)"
                        value={patientInfo.patientId}
                        onChange={(e) => setPatientInfo({ ...patientInfo, patientId: e.target.value })}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Age"
                            type="number"
                            value={patientInfo.age}
                            onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth>
                            <InputLabel>Gender</InputLabel>
                            <Select
                              value={patientInfo.gender}
                              label="Gender"
                              onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                            >
                              <MenuItem value="Male">Male</MenuItem>
                              <MenuItem value="Female">Female</MenuItem>
                              <MenuItem value="Other">Other</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <TextField
                        fullWidth
                        label="Medical History"
                        multiline
                        rows={3}
                        value={patientInfo.medicalHistory}
                        onChange={(e) => setPatientInfo({ ...patientInfo, medicalHistory: e.target.value })}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Symptoms Selection
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      options={availableSymptoms}
                      getOptionLabel={(option) => option.name}
                      value={selectedSymptoms}
                      onChange={handleSymptomsChange}
                      filterSelectedOptions
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search and select symptoms"
                          placeholder="Type to search symptoms..."
                        />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip
                            label={option.name}
                            {...getTagProps({ index })}
                            key={option.value}
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      }
                    />

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={detectDisease}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <MLIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                        }}
                      >
                        {loading ? 'Detecting Disease...' : 'Detect Disease'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box>
              {/* Existing symptom-based detection results */}
              <Grid container spacing={3}>
                {/* Patient Info & Diagnosis */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PatientIcon /> Patient Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography><strong>Name:</strong> {patientInfo.name}</Typography>
                        <Typography><strong>ID:</strong> {patientInfo.patientId || 'Auto-generated'}</Typography>
                        <Typography><strong>Age:</strong> {patientInfo.age}</Typography>
                        <Typography><strong>Gender:</strong> {patientInfo.gender}</Typography>
                        <Typography><strong>Medical History:</strong> {patientInfo.medicalHistory}</Typography>
                      </Box>
                      
                      {patientSaved && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckIcon />
                            Patient automatically added to records
                          </Box>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MLIcon /> AI Diagnosis
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ backgroundColor: getSeverityColor(prediction?.confidence) }}>
                          <DiagnosisIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {prediction?.predicted_condition}
                          </Typography>
                          <Chip
                            label={`${getSeverityLevel(prediction?.confidence)} Severity`}
                            sx={{ 
                              backgroundColor: getSeverityColor(prediction?.confidence),
                              color: 'white',
                              fontWeight: 600
                            }}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {(prediction?.confidence * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Similar Patients */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon /> Similar Patient Cases
                      </Typography>
                      <List>
                        {similarPatients.slice(0, 3).map((patient, index) => (
                          <ListItem key={patient.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 1 }}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {patient.name} ({patient.age}{patient.gender[0]})
                                </Typography>
                                <Chip
                                  label={`${(patient.similarity * 100).toFixed(0)}% match`}
                                  color="primary"
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Outcome:</strong> {patient.treatmentOutcome} in {patient.treatmentDuration}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Treatment Recommendations */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MedicationIcon /> Treatment Recommendations
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#dc2626' }}>
                                Immediate Actions
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {remedies.immediate?.map((action, index) => (
                                  <ListItem key={index} sx={{ px: 0 }}>
                                    <ListItemText primary={action} />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0891b2' }}>
                                Medications
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {remedies.medications?.map((medication, index) => (
                                  <ListItem key={index} sx={{ px: 0 }}>
                                    <ListItemText primary={medication} />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#059669' }}>
                                Lifestyle & Follow-up
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {remedies.lifestyle?.map((lifestyle, index) => (
                                  <ListItem key={index} sx={{ px: 0 }}>
                                    <ListItemText primary={lifestyle} />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<ReportIcon />}
                  onClick={generateReport}
                  sx={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    fontWeight: 600,
                  }}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetDetection}
                >
                  New Detection
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Skin Disease Detection Tab */}
      {activeTab === 1 && (
        <Box>
          {!skinDetectionComplete ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Patient Information
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Patient Name"
                        value={skinPatientInfo.name}
                        onChange={(e) => setSkinPatientInfo({ ...skinPatientInfo, name: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Patient ID (Optional)"
                        value={skinPatientInfo.patientId}
                        onChange={(e) => setSkinPatientInfo({ ...skinPatientInfo, patientId: e.target.value })}
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Age"
                            type="number"
                            value={skinPatientInfo.age}
                            onChange={(e) => setSkinPatientInfo({ ...skinPatientInfo, age: e.target.value })}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth>
                            <InputLabel>Gender</InputLabel>
                            <Select
                              value={skinPatientInfo.gender}
                              label="Gender"
                              onChange={(e) => setSkinPatientInfo({ ...skinPatientInfo, gender: e.target.value })}
                            >
                              <MenuItem value="Male">Male</MenuItem>
                              <MenuItem value="Female">Female</MenuItem>
                              <MenuItem value="Other">Other</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <TextField
                        fullWidth
                        label="Medical History"
                        multiline
                        rows={3}
                        value={skinPatientInfo.medicalHistory}
                        onChange={(e) => setSkinPatientInfo({ ...skinPatientInfo, medicalHistory: e.target.value })}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Skin Image Upload
                    </Typography>
                    
                    {!imagePreview ? (
                      <Box
                        sx={{
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          p: 4,
                          textAlign: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#0891b2',
                            backgroundColor: '#f8fafc'
                          }
                        }}
                        onClick={() => document.getElementById('skin-image-upload').click()}
                      >
                        <UploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Upload Skin Image
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Click to select an image of the affected skin area
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Supported formats: JPG, PNG, GIF
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Box sx={{ position: 'relative', mb: 2 }}>
                          <img
                            src={imagePreview}
                            alt="Skin condition preview"
                            style={{
                              width: '100%',
                              maxHeight: '300px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)'
                              }
                            }}
                            onClick={removeImage}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<CameraIcon />}
                          onClick={() => document.getElementById('skin-image-upload').click()}
                          fullWidth
                        >
                          Change Image
                        </Button>
                      </Box>
                    )}

                    <input
                      id="skin-image-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={detectSkinDisease}
                        disabled={skinLoading || !selectedImage}
                        startIcon={skinLoading ? <CircularProgress size={20} /> : <MLIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                          fontWeight: 600,
                          px: 4,
                          py: 1.5,
                        }}
                      >
                        {skinLoading ? 'Analyzing Image...' : 'Detect Skin Condition'}
                      </Button>
                    </Box>

                    {skinConditions.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Can detect {skinConditions.length} skin conditions including:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {skinConditions.slice(0, 6).map((condition, index) => (
                            <Chip
                              key={index}
                              label={condition.replace(/Photos?/g, '').trim()}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {skinConditions.length > 6 && (
                            <Chip
                              label={`+${skinConditions.length - 6} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box>
              {/* Skin Disease Detection Results */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PatientIcon /> Patient Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography><strong>Name:</strong> {skinPatientInfo.name}</Typography>
                        <Typography><strong>ID:</strong> {skinPatientInfo.patientId || 'Auto-generated'}</Typography>
                        <Typography><strong>Age:</strong> {skinPatientInfo.age}</Typography>
                        <Typography><strong>Gender:</strong> {skinPatientInfo.gender}</Typography>
                        <Typography><strong>Medical History:</strong> {skinPatientInfo.medicalHistory}</Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MLIcon /> AI Skin Analysis
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ backgroundColor: '#dc2626' }}>
                          <DiagnosisIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {skinPrediction?.predicted_condition?.replace(/Photos?/g, '').trim()}
                          </Typography>
                          <Chip
                            label={`${skinPrediction?.confidence_level} Confidence`}
                            sx={{ 
                              backgroundColor: skinPrediction?.confidence_level === 'High' ? '#059669' : 
                                             skinPrediction?.confidence_level === 'Medium' ? '#f59e0b' : '#dc2626',
                              color: 'white',
                              fontWeight: 600
                            }}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {(skinPrediction?.confidence * 100).toFixed(1)}%
                      </Typography>
                      
                      {skinPrediction?.mock_mode && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Demo Mode: Real TensorFlow model will be loaded when compatible Python version is available.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Uploaded Image
                      </Typography>
                      <img
                        src={imagePreview}
                        alt="Analyzed skin condition"
                        style={{
                          width: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0'
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Alternative Diagnoses
                      </Typography>
                      <List>
                        {skinPrediction?.top_predictions?.slice(1, 4).map((pred, index) => (
                          <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 1 }}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {pred.condition.replace(/Photos?/g, '').trim()}
                                </Typography>
                                <Chip
                                  label={`${pred.confidence_percentage.toFixed(1)}%`}
                                  color="secondary"
                                  size="small"
                                />
                              </Box>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<ReportIcon />}
                  onClick={generateReport}
                  sx={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    fontWeight: 600,
                  }}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetSkinDetection}
                >
                  New Analysis
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Medical Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Generate a comprehensive medical report for this patient?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The report will include:
          </Typography>
          <List dense>
            <ListItem>• Complete patient information</ListItem>
            <ListItem>• AI diagnosis with confidence levels</ListItem>
            <ListItem>• Similar patient cases</ListItem>
            <ListItem>• Treatment recommendations</ListItem>
            <ListItem>• Print and download options</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button onClick={confirmGenerateReport} variant="contained">
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generated Report View */}
      {reportGenerated && (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Medical Report Generated
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={printReport}
                >
                  Print
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={downloadReport}
                >
                  Download
                </Button>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Report generated successfully. Patient record has been saved to the database.
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default DiseaseHelper;