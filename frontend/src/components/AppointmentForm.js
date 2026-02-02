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
} from '@mui/material';
import { appointmentsAPI, patientsAPI, doctorsAPI } from '../services/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

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
                  setFormData(prev => ({ ...prev, doctor: newValue?._id || '' }));
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
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="time"
                label="Appointment Time"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
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
