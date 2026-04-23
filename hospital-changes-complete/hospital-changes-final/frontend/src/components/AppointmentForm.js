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
  Alert,
  CircularProgress,
  Autocomplete,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { appointmentsAPI, patientsAPI, doctorsAPI } from '../services/api';
import axios from 'axios';

const AppointmentForm = ({ open, onClose, onSuccess, appointment = null }) => {
  const isEdit = !!appointment;
  
  const [formData, setFormData] = useState({
    patient: appointment?.patient?._id || '',
    doctor: appointment?.doctor?._id || '',
    appointmentDate: appointment?.appointmentDate?.split('T')[0] || '',
    appointmentTime: appointment?.appointmentTime || '',
    type: appointment?.type || 'Consultation',
    visitType: appointment?.visitType || 'Outpatient',
    requiresBed: appointment?.requiresBed || false,
    reason: appointment?.reason || '',
    notes: appointment?.notes || '',
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotInfo, setSlotInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

  useEffect(() => {
    // Fetch available slots when doctor and date are selected
    if (formData.doctor && formData.appointmentDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSlotInfo(null);
    }
  }, [formData.doctor, formData.appointmentDate]);

  const fetchPatientsAndDoctors = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        patientsAPI.getAll({ limit: 1000 }),
        doctorsAPI.getAll({ limit: 1000 })
      ]);
      setPatients(patientsRes.data.patients || []);
      setDoctors(doctorsRes.data.doctors || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/doctors/${formData.doctor}/available-slots?date=${formData.appointmentDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAvailableSlots(response.data.availableSlots || []);
      setSlotInfo(response.data);
      
      // Clear selected time if it's no longer available
      if (formData.appointmentTime) {
        const isStillAvailable = response.data.availableSlots.some(
          slot => slot.startTime === formData.appointmentTime
        );
        if (!isStillAvailable) {
          setFormData(prev => ({ ...prev, appointmentTime: '' }));
        }
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err.response?.data?.message || 'Failed to fetch available slots');
      setAvailableSlots([]);
      setSlotInfo(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await appointmentsAPI.update(appointment._id, formData);
      } else {
        await appointmentsAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError(err.response?.data?.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Appointment' : 'Schedule New Appointment'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.patientId})`}
                value={patients.find(p => p._id === formData.patient) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, patient: newValue?._id || '' }));
                }}
                renderInput={(params) => (
                  <TextField {...params} required label="Patient" />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={doctors}
                getOptionLabel={(option) => `Dr. ${option.firstName} ${option.lastName} - ${option.specialization}`}
                value={doctors.find(d => d._id === formData.doctor) || null}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    doctor: newValue?._id || '',
                    appointmentTime: '' // Reset time when doctor changes
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} required label="Doctor" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Appointment Date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    appointmentDate: e.target.value,
                    appointmentTime: '' // Reset time when date changes
                  }));
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {formData.doctor && formData.appointmentDate ? (
                <FormControl fullWidth required>
                  <InputLabel>Available Time Slots</InputLabel>
                  <Select
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    label="Available Time Slots"
                    disabled={loadingSlots || availableSlots.length === 0}
                  >
                    {loadingSlots ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading slots...
                      </MenuItem>
                    ) : availableSlots.length === 0 ? (
                      <MenuItem disabled>
                        No available slots for this date
                      </MenuItem>
                    ) : (
                      availableSlots.map((slot) => (
                        <MenuItem key={slot.startTime} value={slot.startTime}>
                          {slot.startTime} - {slot.endTime} ({slot.duration} min)
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  label="Appointment Time"
                  value=""
                  disabled
                  helperText="Select doctor and date first"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Grid>
            
            {/* Slot Information Display */}
            {slotInfo && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: slotInfo.isAvailable ? '#f0fdf4' : '#fef2f2', 
                  borderRadius: 2,
                  border: `1px solid ${slotInfo.isAvailable ? '#86efac' : '#fca5a5'}`
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    📅 {slotInfo.dayOfWeek} Schedule
                  </Typography>
                  {slotInfo.isAvailable ? (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Working Hours: {slotInfo.workingHours.startTime} - {slotInfo.workingHours.endTime}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Slot Duration: {slotInfo.workingHours.slotDuration} minutes
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`${slotInfo.totalSlots} slots available`} 
                          color="success" 
                          size="small" 
                        />
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="error">
                      Doctor is not available on this day
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Appointment Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <MenuItem value="Consultation">Consultation</MenuItem>
                <MenuItem value="Follow-up">Follow-up</MenuItem>
                <MenuItem value="Emergency">Emergency</MenuItem>
                <MenuItem value="Surgery">Surgery</MenuItem>
                <MenuItem value="Checkup">Checkup</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Visit Type"
                name="visitType"
                value={formData.visitType}
                onChange={(e) => {
                  const visitType = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    visitType,
                    requiresBed: visitType === 'Inpatient'
                  }));
                }}
                helperText={formData.visitType === 'Inpatient' ? 'Patient will be admitted and needs a bed' : 'Patient will only meet the doctor'}
              >
                <MenuItem value="Outpatient">Outpatient (Consultation Only)</MenuItem>
                <MenuItem value="Inpatient">Inpatient (Admission Required)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Visit"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
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
            {isEdit ? 'Update' : 'Schedule'} Appointment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AppointmentForm;
