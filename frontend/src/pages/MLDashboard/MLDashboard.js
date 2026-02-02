import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  Assessment as AnalysisIcon,
} from '@mui/icons-material';

function MLDashboard() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputData, setInputData] = useState({
    symptoms: '',
    age: '',
    gender: '',
  });

  useEffect(() => {
    // Mock ML predictions
    setPredictions([
      {
        id: 1,
        patient: 'John Doe',
        prediction: 'Low Risk',
        confidence: 85,
        date: '2024-01-15',
      },
      {
        id: 2,
        patient: 'Jane Smith',
        prediction: 'Medium Risk',
        confidence: 72,
        date: '2024-01-14',
      },
      {
        id: 3,
        patient: 'Mike Johnson',
        prediction: 'High Risk',
        confidence: 91,
        date: '2024-01-13',
      },
    ]);
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      // Mock API call to ML service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock prediction result
      const newPrediction = {
        id: Date.now(),
        patient: 'New Patient',
        prediction: 'Medium Risk',
        confidence: 78,
        date: new Date().toISOString().split('T')[0],
      };
      
      setPredictions([newPrediction, ...predictions]);
      setInputData({ symptoms: '', age: '', gender: '' });
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPredictionColor = (prediction) => {
    switch (prediction) {
      case 'Low Risk':
        return 'success';
      case 'Medium Risk':
        return 'warning';
      case 'High Risk':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ML Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Risk Prediction
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Symptoms"
                  multiline
                  rows={3}
                  value={inputData.symptoms}
                  onChange={(e) => setInputData({ ...inputData, symptoms: e.target.value })}
                  placeholder="Enter patient symptoms..."
                />
                
                <TextField
                  label="Age"
                  type="number"
                  value={inputData.age}
                  onChange={(e) => setInputData({ ...inputData, age: e.target.value })}
                />
                
                <TextField
                  label="Gender"
                  select
                  value={inputData.gender}
                  onChange={(e) => setInputData({ ...inputData, gender: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </TextField>

                <Button
                  variant="contained"
                  onClick={handlePredict}
                  disabled={loading || !inputData.symptoms}
                  startIcon={loading ? <CircularProgress size={20} /> : <AnalysisIcon />}
                >
                  {loading ? 'Analyzing...' : 'Predict Risk'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ML Insights
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    Model Accuracy
                  </Typography>
                  <Typography variant="h4">
                    94.2%
                  </Typography>
                </Paper>
                
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    Predictions Today
                  </Typography>
                  <Typography variant="h4">
                    {predictions.length}
                  </Typography>
                </Paper>
                
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    High Risk Cases
                  </Typography>
                  <Typography variant="h4">
                    {predictions.filter(p => p.prediction === 'High Risk').length}
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Predictions
              </Typography>
              
              <List>
                {predictions.map((prediction) => (
                  <ListItem key={prediction.id} divider>
                    <ListItemText
                      primary={`${prediction.patient} - ${prediction.date}`}
                      secondary={`Confidence: ${prediction.confidence}%`}
                    />
                    <Chip
                      label={prediction.prediction}
                      color={getPredictionColor(prediction.prediction)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default MLDashboard;