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
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { mlApi } from '../../services/mlApi';

function GenerateReport() {
  const { user } = useSelector((state) => state.auth);
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
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    loadSymptoms();
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

  const handleSymptomsChange = (event, newValue) => {
    setSelectedSymptoms(newValue);
  };

  const generateReport = async () => {
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

      // Save patient record to database
      await savePatientRecord(result.prediction, mockSimilarPatients, generatedRemedies);

      setReportGenerated(true);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
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
        notes: `Generated report with ${prediction.confidence * 100}% confidence. Treatment plan based on ${getSeverityLevel(prediction.confidence)} severity level.`
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
      // Don't show error to user as report generation was successful
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

  const printReport = () => {
    window.print();
  };

  const downloadReport = () => {
    // Create a comprehensive report content
    const reportContent = `
MEDICAL REPORT
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

AI PREDICTION:
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
    a.download = `medical-report-${patientInfo.name}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#0891b2' }}>
        Medical Report Generator
      </Typography>

      {!reportGenerated ? (
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
                    label="Patient ID"
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
                    onClick={generateReport}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <DiagnosisIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {loading ? 'Generating Report...' : 'Generate Medical Report'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Box>
          {/* Report Header */}
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Medical Report
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
              Generated on: {new Date().toLocaleDateString()} | Doctor: {user?.name}
            </Typography>
          </Paper>

          <Grid container spacing={3}>
            {/* Patient Info & Prediction */}
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PatientIcon /> Patient Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Name:</strong> {patientInfo.name}</Typography>
                    <Typography><strong>ID:</strong> {patientInfo.patientId}</Typography>
                    <Typography><strong>Age:</strong> {patientInfo.age}</Typography>
                    <Typography><strong>Gender:</strong> {patientInfo.gender}</Typography>
                    <Typography><strong>Medical History:</strong> {patientInfo.medicalHistory}</Typography>
                  </Box>
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
                    {similarPatients.map((patient, index) => (
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
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Outcome:</strong> {patient.treatmentOutcome} in {patient.treatmentDuration}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Severity:</strong> {patient.severity} | <strong>Notes:</strong> {patient.notes}
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

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setReportGenerated(false);
                setPrediction(null);
                setSimilarPatients([]);
                setRemedies([]);
              }}
            >
              Generate New Report
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default GenerateReport;