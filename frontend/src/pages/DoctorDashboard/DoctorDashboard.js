import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
} from '@mui/material';
import {
  Psychology as MLIcon,
  Person as PatientIcon,
  Assessment as DiagnosisIcon,
  Warning as WarningIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

function DoctorDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRecords: 0,
    accuracy: 87,
    recoveryRate: 0
  });

  useEffect(() => {
    loadPatientRecords();
    loadAnalytics();
    
    // Listen for new patient records
    const handleNewRecord = (event) => {
      const newRecord = event.detail;
      setPredictionHistory(prev => [
        {
          id: newRecord._id,
          patientName: newRecord.name,
          date: new Date(newRecord.reportDate).toISOString().split('T')[0],
          symptoms: newRecord.symptoms,
          prediction: newRecord.diagnosis.predictedCondition,
          confidence: newRecord.diagnosis.confidence,
        },
        ...prev.slice(0, 9) // Keep only 10 most recent
      ]);
    };

    window.addEventListener('patientRecordAdded', handleNewRecord);
    return () => window.removeEventListener('patientRecordAdded', handleNewRecord);
  }, []);

  const loadPatientRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/patient-records`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const records = await response.json();
        const formattedHistory = records.map(record => ({
          id: record._id,
          patientName: record.name,
          date: new Date(record.reportDate).toISOString().split('T')[0],
          symptoms: record.symptoms,
          prediction: record.diagnosis.predictedCondition,
          confidence: record.diagnosis.confidence,
        }));
        setPredictionHistory(formattedHistory);
      } else {
        // Fallback to mock data if API fails
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading patient records:', error);
      loadMockData();
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/patient-records/analytics/accuracy`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadMockData = () => {
    // Load prediction history (mock data as fallback)
    const mockHistory = [
      {
        id: 1,
        patientName: 'John Smith',
        date: '2024-01-20',
        symptoms: ['fever', 'cough', 'fatigue'],
        prediction: 'Common Cold',
        confidence: 0.85,
      },
      {
        id: 2,
        patientName: 'Mary Johnson',
        date: '2024-01-19',
        symptoms: ['headache', 'nausea', 'dizziness'],
        prediction: 'Migraine',
        confidence: 0.78,
      },
      {
        id: 3,
        patientName: 'Robert Davis',
        date: '2024-01-18',
        symptoms: ['chest_pain', 'shortness_of_breath', 'fatigue'],
        prediction: 'Heart Disease',
        confidence: 0.92,
      },
    ];
    setPredictionHistory(mockHistory);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#0891b2',
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Doctor Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.name} - {user?.specialization}
            </Typography>
          </Box>
          
          <Chip
            label={user?.mlAccess ? 'ML Access Enabled' : 'ML Access Disabled'}
            color={user?.mlAccess ? 'success' : 'default'}
            icon={<MLIcon />}
          />
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#0891b2',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <PatientIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                24
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Patients Today
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#059669',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <DiagnosisIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {analytics.totalRecords || predictionHistory.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reports Generated
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#dc2626',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <WarningIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Risk Cases
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <ScienceIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {analytics.accuracy}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ML Accuracy Rate
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Recent Reports History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Recent Medical Reports
          </Typography>
          
          <List>
            {predictionHistory.map((item) => (
              <ListItem key={item.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 2 }}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.patientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.date}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    {item.symptoms.map((symptom) => (
                      <Chip key={symptom} label={symptom} size="small" variant="outlined" />
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0891b2' }}>
                      Diagnosis: {item.prediction}
                    </Typography>
                    <Chip
                      label={`${(item.confidence * 100).toFixed(1)}% confidence`}
                      color={getConfidenceColor(item.confidence)}
                      size="small"
                    />
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

export default DoctorDashboard;