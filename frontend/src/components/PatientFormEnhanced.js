import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider,
  Card,
  CardContent,
  ButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  LocalHospital as HospitalIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';
import { patientsAPI } from '../services/api';
import { toast } from 'react-toastify';
import axios from 'axios';

const PatientFormEnhanced = ({ open, onClose, onSuccess, patient = null }) => {
  const isEdit = !!patient;
  
  const [formData, setFormData] = useState({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    dateOfBirth: patient?.dateOfBirth?.split('T')[0] || '',
    gender: patient?.gender || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    bloodGroup: patient?.bloodGroup || '',
    address: {
      street: patient?.address?.street || '',
      city: patient?.address?.city || '',
      state: patient?.address?.state || '',
      zipCode: patient?.address?.zipCode || '',
      country: patient?.address?.country || 'USA',
    },
    emergencyContact: {
      name: patient?.emergencyContact?.name || '',
      relationship: patient?.emergencyContact?.relationship || '',
      phone: patient?.emergencyContact?.phone || '',
    },
  });

  // Medical Information State
  const [inputMethod, setInputMethod] = useState('symptoms'); // 'symptoms' or 'disease'
  const [diseaseName, setDiseaseName] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [specialistRecommendation, setSpecialistRecommendation] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common symptoms
  const commonSymptoms = [
    'fever', 'cough', 'fatigue', 'headache', 'chest_pain',
    'nausea', 'vomiting', 'dizziness', 'skin_rash', 'itching',
    'breathing_difficulty', 'abdominal_pain', 'joint_pain', 'muscle_pain'
  ];

  // Initialize medical information when editing
  useEffect(() => {
    if (patient && isEdit) {
      // Load medical info if available
      if (patient.medicalInfo) {
        // Set disease name if available
        if (patient.medicalInfo.disease) {
          setDiseaseName(patient.medicalInfo.disease);
          setInputMethod('disease');
        }
        
        // Set symptoms if available
        if (patient.medicalInfo.symptoms && patient.medicalInfo.symptoms.length > 0) {
          const symptomsObj = {};
          patient.medicalInfo.symptoms.forEach(symptom => {
            symptomsObj[symptom] = 1;
          });
          setSelectedSymptoms(symptomsObj);
          if (!patient.medicalInfo.disease) {
            setInputMethod('symptoms');
          }
        }
        
        // Set specialist recommendation if available
        if (patient.medicalInfo.recommendedSpecialist) {
          setSpecialistRecommendation({
            specialist: patient.medicalInfo.recommendedSpecialist,
            confidence: patient.medicalInfo.specialistConfidence || 0,
            disease: patient.medicalInfo.disease,
            reasoning: 'Previously recommended specialist'
          });
        }
      }
      
      // Load auto-assignment info if available
      if (patient.autoAssignment && patient.autoAssignment.isAutoAssigned) {
        if (patient.autoAssignment.predictedDisease && !diseaseName) {
          setDiseaseName(patient.autoAssignment.predictedDisease);
          setInputMethod('disease');
        }
        
        if (patient.autoAssignment.assignedSpecialistType) {
          setSpecialistRecommendation({
            specialist: patient.autoAssignment.assignedSpecialistType,
            confidence: patient.autoAssignment.diseaseConfidence || 0,
            disease: patient.autoAssignment.predictedDisease,
            reasoning: 'Auto-assigned by ML system'
          });
        }
      }
    }
  }, [patient, isEdit]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setDiseaseName('');
      setSelectedSymptoms({});
      setSpecialistRecommendation(null);
      setInputMethod('symptoms');
      setError(null);
    }
  }, [open]);

  // Update formData when patient prop changes
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        email: patient.email || '',
        bloodGroup: patient.bloodGroup || '',
        address: {
          street: patient.address?.street || '',
          city: patient.address?.city || '',
          state: patient.address?.state || '',
          zipCode: patient.address?.zipCode || '',
          country: patient.address?.country || 'USA',
        },
        emergencyContact: {
          name: patient.emergencyContact?.name || '',
          relationship: patient.emergencyContact?.relationship || '',
          phone: patient.emergencyContact?.phone || '',
        },
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => ({
      ...prev,
      [symptom]: prev[symptom] ? 0 : 1
    }));
  };

  const getSpecialistRecommendation = async () => {
    if (inputMethod === 'disease' && !diseaseName.trim()) {
      setError('Please enter a disease name');
      return;
    }

    if (inputMethod === 'symptoms' && Object.values(selectedSymptoms).every(v => v === 0)) {
      setError('Please select at least one symptom');
      return;
    }

    try {
      setMlLoading(true);
      setError(null);

      const requestData = inputMethod === 'disease'
        ? { disease: diseaseName }
        : { symptoms: selectedSymptoms };

      const response = await axios.post(
        'http://localhost:5001/recommend_specialist',
        requestData
      );

      setSpecialistRecommendation(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get specialist recommendation');
    } finally {
      setMlLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare patient data with medical info
      const patientData = {
        ...formData,
        medicalInfo: {
          symptoms: Object.keys(selectedSymptoms).filter(s => selectedSymptoms[s] === 1),
          disease: diseaseName || specialistRecommendation?.disease,
          recommendedSpecialist: specialistRecommendation?.specialist,
          specialistConfidence: specialistRecommendation?.confidence,
        }
      };

      let savedPatient;
      if (isEdit) {
        const response = await patientsAPI.update(patient._id, patientData);
        savedPatient = response.data.patient;
      } else {
        const response = await patientsAPI.create(patientData);
        savedPatient = response.data.patient;
      }

      // Auto-assign staff in background if specialist is recommended
      if (specialistRecommendation && !isEdit) {
        autoAssignStaff(savedPatient._id, specialistRecommendation);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving patient:', err);
      setError(err.response?.data?.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  const autoAssignStaff = async (patientId, recommendation) => {
    try {
      // Call backend auto-assignment endpoint
      const response = await patientsAPI.autoAssign(patientId, {
        prediction_type: inputMethod,
        symptoms: inputMethod === 'symptoms' ? selectedSymptoms : undefined,
        disease: inputMethod === 'disease' ? diseaseName : undefined
      });
      
      console.log('Staff auto-assigned successfully:', response.data);
      
      if (response.data.success) {
        toast.success('✅ Auto-assignment completed! Doctor, Nurse, and Bed assigned.');
      }
    } catch (err) {
      console.error('Auto-assignment failed:', err);
      toast.warning('Patient created but auto-assignment failed. Please assign manually.');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <HospitalIcon color="primary" />
          {isEdit ? 'Edit Patient' : 'Add New Patient'}
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Information */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Basic Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Blood Group"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Medical Information with AI */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <BrainIcon color="secondary" />
                <Typography variant="h6">Medical Information (AI-Powered)</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {/* Input Method Toggle */}
                <Grid item xs={12}>
                  <ButtonGroup fullWidth>
                    <Button
                      variant={inputMethod === 'symptoms' ? 'contained' : 'outlined'}
                      onClick={() => setInputMethod('symptoms')}
                    >
                      Enter Symptoms
                    </Button>
                    <Button
                      variant={inputMethod === 'disease' ? 'contained' : 'outlined'}
                      onClick={() => setInputMethod('disease')}
                    >
                      Known Disease
                    </Button>
                  </ButtonGroup>
                </Grid>

                {/* Symptoms Input */}
                {inputMethod === 'symptoms' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Symptoms:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {commonSymptoms.map(symptom => (
                        <FormControlLabel
                          key={symptom}
                          control={
                            <Checkbox
                              checked={selectedSymptoms[symptom] === 1}
                              onChange={() => toggleSymptom(symptom)}
                            />
                          }
                          label={symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* Disease Input */}
                {inputMethod === 'disease' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Disease Name"
                      value={diseaseName}
                      onChange={(e) => setDiseaseName(e.target.value)}
                      placeholder="e.g., Heart Disease, Diabetes, Migraine"
                    />
                  </Grid>
                )}

                {/* Get Recommendation Button */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    onClick={getSpecialistRecommendation}
                    disabled={mlLoading}
                    startIcon={mlLoading ? <CircularProgress size={20} /> : <BrainIcon />}
                  >
                    {mlLoading ? 'Analyzing...' : 'Get AI Specialist Recommendation'}
                  </Button>
                </Grid>

                {/* Recommendation Result */}
                {specialistRecommendation && (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recommended Specialist
                        </Typography>
                        <Typography variant="h4" gutterBottom>
                          {specialistRecommendation.specialist}
                        </Typography>
                        <Box display="flex" gap={1} mb={1}>
                          <Chip 
                            label={`Confidence: ${(specialistRecommendation.confidence * 100).toFixed(1)}%`}
                            color="primary"
                          />
                          {specialistRecommendation.disease && (
                            <Chip 
                              label={`Disease: ${specialistRecommendation.disease}`}
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="body2">
                          {specialistRecommendation.reasoning}
                        </Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Staff will be automatically assigned when you save this patient
                        </Alert>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Address */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Address</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Emergency Contact */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Emergency Contact</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Emergency Phone"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {isEdit ? 'Update' : 'Add'} Patient
            {specialistRecommendation && ' & Auto-Assign Staff'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PatientFormEnhanced;
