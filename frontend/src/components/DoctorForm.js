import React, { useState } from 'react';
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
} from '@mui/material';
import { doctorsAPI } from '../services/api';

const DoctorForm = ({ open, onClose, onSuccess, doctor = null }) => {
  const isEdit = !!doctor;
  
  const [formData, setFormData] = useState({
    firstName: doctor?.firstName || '',
    lastName: doctor?.lastName || '',
    dateOfBirth: doctor?.dateOfBirth?.split('T')[0] || '',
    gender: doctor?.gender || '',
    phone: doctor?.phone || '',
    email: doctor?.email || '',
    specialization: doctor?.specialization || '',
    experience: doctor?.experience || '',
    consultationFee: doctor?.consultationFee || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const specializations = [
    'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
    'Pediatrics', 'Gynecology', 'Dermatology', 'Psychiatry',
    'Radiology', 'Anesthesiology', 'Emergency Medicine', 'Surgery',
    'Oncology', 'Endocrinology', 'Gastroenterology', 'Pulmonology',
    'Nephrology', 'Ophthalmology', 'ENT', 'Urology'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        experience: parseInt(formData.experience),
        consultationFee: parseFloat(formData.consultationFee),
      };

      if (isEdit) {
        await doctorsAPI.update(doctor._id, submitData);
      } else {
        // For new doctors, we need additional required fields
        const newDoctorData = {
          ...submitData,
          medicalLicenseNumber: 'MED-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          userId: localStorage.getItem('userId') || '000000000000000000000000',
          department: localStorage.getItem('userId') || '000000000000000000000000',
        };
        await doctorsAPI.create(newDoctorData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving doctor:', err);
      setError(err.response?.data?.message || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Doctor' : 'Add New Doctor'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
                required
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
                required
                fullWidth
                select
                label="Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
              >
                {specializations.map(spec => (
                  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Experience (years)"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Consultation Fee ($)"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
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
            {isEdit ? 'Update' : 'Add'} Doctor
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DoctorForm;
